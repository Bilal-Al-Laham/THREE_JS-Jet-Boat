import * as THREE from 'three';

import Stats from 'three/examples/jsm/libs/stats.module.js';
import {GUI} from 'lil-gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Water } from 'three/examples/jsm/objects/Water';
import { Sky } from 'three/examples/jsm/objects/Sky';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';

let camera, scene, renderer, water , stats;
let world,boatShape,boatBody;

const loader = new GLTFLoader();
class Boat {
    constructor(){
		loader.load("assests/maverick_gt/scene.gltf" , (gltf) => {
		const model = gltf.scene;
		model.scale.set(6, 6, 6);
		model.position.set(0, -0.7, 1);
		model.rotation.set(0, -0.6, 0);
		scene.add(model);
			
    this.boat = gltf.scene;
    this.speed = {
        vel: 0,
        rot: 0
    }
	// تحويل القارب الى قارب فيزيائي  
	boatShape = new CANNON.Box(new CANNON.Vec3(3,1,1));
	boatBody = new CANNON.Body({mass:5});
	boatBody.addShape(boatShape);
	boatBody.position.set(0,-1,-1);
	world.addBody(boatBody)
});
}
stop(){
    this.speed.vel = 0  ;
    this.speed.rot = 0;
}

update(){
    if(this.boat){
    this.boat.rotation.y +=  this.speed.rot ;
    this.boat.translateX(this.speed.vel);
	
	// تحديث موضع الكاميرا بالنسبة للقارب
	const distance = 25; // المسافة بين القارب والكاميرا
	const hight = 25; // ارتفاع القارب عن الكاميرا
	const rotationAngle = this.boat.rotation.y; // زاوية دوران القارب

	//  حساب الازاحة النسبية للكاميرا من القارب عن طريق زاوية الدوران
	const offsetX = 1.5*distance * Math.cos(rotationAngle);
    const offsetZ = 1.5*distance * Math.sin(rotationAngle);
    
    // إنشاء متجه ازاحة القارب عن طريق شعاع التوجيه للقارب
    const offset = new THREE.Vector3(offsetX, 0.7*hight, -offsetZ);

    // حساب موضع الكاميرا الجديد
    const newCameraPosition = new THREE.Vector3().addVectors(this.boat.position, offset);

    // تحديث موضع الكاميرا
    camera.position.set(newCameraPosition.x, newCameraPosition.y, newCameraPosition.z);
    camera.lookAt(this.boat.position);

	// تحديث موقف القارب بعد انشاء عالم الفيزياء عليه
	boatBody.position.copy(this.boat.position);
	boatBody.quaternion.copy(this.boat.quaternion);
		}
	}
}

// const boat = new Boat();

const boat = new Boat();


class mountain{
	constructor(){
		loader.load("assests/el_capitan/scene.gltf" ,(gltf) => {
			const model2 = gltf.scene;
			model2.scale.set(1200, 1200, 1200);
			model2.position.set(-1000, 180, 100);
			model2.rotation.set(0, 1.5, 0);
			scene.add(model2);
		}
	)}
}
const mountain2 = new mountain();

init();
animate();

function init() {
camera = new THREE.PerspectiveCamera( 
    75,
    window.innerWidth / window.innerHeight, 
    0.1, 
    20000 );
camera.position.set(20, 11, 15 );
camera.rotation.set( 0, 0, 0 );

renderer = new THREE.WebGLRenderer({
	antialias: true, 
	alpha: true
});
renderer.shadowMap.enabled = true
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;
document.body.appendChild( renderer.domElement );
	

scene = new THREE.Scene();
scene.background = new THREE.Color(0xdddddd);

world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

const sun = new THREE.Vector3();

const waterGeometry = new THREE.PlaneGeometry( 10000, 10000);
water = new Water(
	waterGeometry,{
        side: THREE.DoubleSide,
		textureWidth: 512,
		textureHeight: 512,
		waterNormals: new THREE.TextureLoader().load( 'assests/waternormals.jpg', function ( texture ) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		}),
        
		sunDirection: new THREE.Vector3(),
		sunColor: 0xffffff,
		waterColor: 0x001e0f,
		distortionScale: 3.7,
		fog: scene.fog !== undefined
		}
	);
	water.rotation.x = - Math.PI / 2;
	scene.add( water );

	// Skybox
	const sky = new Sky();
	sky.scale.setScalar( 10000 );
	scene.add( sky );

	const skyUniforms = sky.material.uniforms;
	skyUniforms[ 'turbidity' ].value = 10;
	skyUniforms[ 'rayleigh' ].value = 2;
	skyUniforms[ 'mieCoefficient' ].value = 0.005;
	skyUniforms[ 'mieDirectionalG' ].value = 0.8;

	const parameters = {
		elevation: 1,
		azimuth: 180
	};

	const pmremGenerator = new THREE.PMREMGenerator( renderer );
	const sceneEnv = new THREE.Scene();

	let renderTarget;

	function updateSun() {

	const phi = THREE.MathUtils.degToRad( 90 - parameters.elevation );
	const theta = THREE.MathUtils.degToRad( parameters.azimuth );

	sun.setFromSphericalCoords( 1, phi, theta );

	sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
	water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();

	if ( renderTarget !== undefined ) renderTarget.dispose();

	sceneEnv.add( sky );
	renderTarget = pmremGenerator.fromScene( sceneEnv );
	scene.add( sky );

	scene.environment = renderTarget.texture;

}
updateSun();


const controls = new OrbitControls( camera, renderer.domElement );
controls.maxPolarAngle = Math.PI * 1;
controls.target.set( 0, 0, 0 );
controls.minDistance = 0.0;
// controls.maxDistance = 2000000.0;
controls.update();

stats = new Stats();
document.body.appendChild( stats.dom );

const axesHelper = new THREE.AxesHelper(3);
// scene.add(axesHelper);

const gridhelper = new THREE.GridHelper(20,20);
//scene.add(gridhelper);

	// GUI

const gui = new GUI();
const folderSky = gui.addFolder( 'Sky' );
folderSky.add( parameters, 'elevation', 0, 90, 0.1 ).onChange( updateSun );
folderSky.add( parameters, 'azimuth', - 180, 180, 0.1 ).onChange( updateSun );
folderSky.open();

const waterUniforms = water.material.uniforms;
const folderWater = gui.addFolder( 'Water' );
folderWater.add( waterUniforms.distortionScale, 'value', 0, 8, 0.1 ).name( 'distortionScale' );
folderWater.add( waterUniforms.size, 'value', 0.1, 10, 0.1 ).name( 'size' );
folderWater.open();

window.addEventListener( 'resize', onWindowResize );
}

window.addEventListener('keydown' , function(e){
	if(e.key == "ArrowUp"){
		boat.speed.vel = -1
	}
	if(e.key == "ArrowDown"){
		boat.speed.vel = 1
	}
	if(e.key == "ArrowRight"){ 
		boat.speed.rot = -0.1
	}
	if(e.key == "ArrowLeft"){
		boat.speed.rot = 0.1
	}
});
window.addEventListener('keyup' , function(e){
	boat.stop();
});

function onWindowResize() {
camera.aspect = window.innerWidth / window.innerHeight;
camera.updateProjectionMatrix();
renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
	requestAnimationFrame( animate );
	render();
	stats.update();
    boat.update();

	world.step(1 / 60); // تحديث
}
window.addEventListener('resize' , onWindowResize , false);

function render() {
	console.log("hello");
	// const time = new performance.now() * 0.001;
	// mesh.position.y = Math.sin( time ) * 20 + 5;
	// mesh.rotation.x = time * 0.5;
	// mesh.rotation.z = time * 0.51;
	water.material.uniforms[ 'time' ].value += 2.0 / 150.0;
	renderer.render( scene, camera );

}