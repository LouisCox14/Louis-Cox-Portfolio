import './style.css'
import * as THREE from 'three';
import { GLTFLoader } from "./node_modules/three/examples/jsm/loaders/GLTFloader.js";
import { CSS3DRenderer, CSS3DObject } from "./node_modules/three/examples/jsm/renderers/CSS3DRenderer.js";

// GENERAL USE FUNCTIONS

function degToRad(degrees)
{
  // Converts degrees to radians
  return degrees * 0.0174533;
}

function quadraticFilter(ease, time) 
{
  const s = time ? Math.min(1, time) : 0;
  const f = time ? Math.min(1, -ease * s * s + (1 + ease) * s) : 0;
  return f;
};

// SCENE SETUP

const scene = new THREE.Scene();
const htmlScene = new THREE.Scene();
htmlScene.scale.set(0.1, 0.1, 0.1);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#scene') });
const htmlRenderer = new CSS3DRenderer();
 
document.body.appendChild(htmlRenderer.domElement);

renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;

renderer.setSize(window.innerWidth, window.innerHeight);
htmlRenderer.setSize(window.innerWidth, window.innerHeight);

window.addEventListener( 'resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
  htmlRenderer.setSize(window.innerWidth, window.innerHeight);
}, false );

camera.up.set(0, 0, 1);
camera.lookAt(0, 0, -1.75);

// GEOMETRY
const gltfLoader = new GLTFLoader();
gltfLoader.setPath('models/');

function LoadModel(objectName, fileName, startPos = { x: 0, y: 0, z: 0 }, startRot = { x: 0, y: 0, z: 0 })
{
  gltfLoader.load(fileName, (object) => {
    object.scene.name = objectName;
    object.scene.position.set(startPos.x, startPos.y, startPos.z);
    object.scene.rotation.set(degToRad(startRot.x), degToRad(startRot.y), degToRad(startRot.z));

    scene.add(object.scene);
    window.dispatchEvent(new CustomEvent('objectLoaded', { 'object' : object }));
  });
}

import sceneData from './SceneObjects.json' assert { type: 'json' };

let totalSceneObjects = sceneData["Objects"].length;
let objectsLoaded = 0;

for (var i = 0; i < totalSceneObjects; i++) 
{
  var object = sceneData["Objects"][i];
  LoadModel(object["name"], object["fileName"], object["startPos"], object["startRot"]);
}

const sceneLoadedEvent = new Event("sceneLoaded");
window.addEventListener('objectLoaded', (e) => {
  objectsLoaded += 1;

  if (objectsLoaded == totalSceneObjects)
  {
    window.dispatchEvent(sceneLoadedEvent);
  }
});

// HTML ELEMENTS

import pageData from './ScenePages.json' assert { type: 'json' };

for (var htmlElement in pageData["Objects"]) 
{
  cssElement = new CSS3DObject(document.getElementById(htmlElement["elementName"]));

  console.log(htmlElement["elementName"]);

  cssElement.name = htmlElement["name"];

  elementPos = htmlElement["startPos"];
  cssElement.position.set(elementPos.x, elementPos.y, elementPos.z);

  elementRot = htmlElement["startRot"];
  cssElement.rotation.set(degToRad(elementRot.x), degToRad(elementRot.y), degToRad(elementRot.z));
  
  htmlScene.add(cssElement);
}

// LIGHTS

var keyLight = new THREE.DirectionalLight(new THREE.Color('hsl(30, 100%, 75%)'), 1);
keyLight.position.set(-100, 20, 100);

var fillLight = new THREE.DirectionalLight(new THREE.Color('hsl(240, 100%, 75%)'), 0.75);
fillLight.position.set(100, 20, 100);

var backLight = new THREE.DirectionalLight(0xffffff, 1);
backLight.position.set(100, 20, -100).normalize();

var light = new THREE.PointLight( 0xffffff, 2, 100 );
light.position.set( 0, 30, 0 );

scene.add(light);
scene.add(keyLight);
scene.add(fillLight);
scene.add(backLight);

// INPUT EVENTS

let mousePos = { x: 0, y: 0 };

window.addEventListener('mousemove', (e) => {
  mousePos = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
});

// UPDATE

const updateEvent = new CustomEvent('update', { 'deltaTime' : 0 });

function Update()
{
  var now = Date.now();
  var deltaTime = (now - lastUpdate) / 1000;
  lastUpdate = now;

  requestAnimationFrame(Update);

  updateEvent.deltaTime = deltaTime;
  window.dispatchEvent(updateEvent);

  renderer.render(scene, camera);
  htmlRenderer.render(htmlScene, camera);
}

window.addEventListener('update', function (e) 
{
  camera.lookAt(0, -5, 10);
  camera.rotation.x += (mousePos.y - 0.5) * 0.15;
  camera.rotation.y += (mousePos.x - 0.5) * 0.20;
});

let camAnimTotalTime = 3.5;
let camAnimCurrentTime = 0;

window.addEventListener('sceneLoaded', function (e) 
{
  window.addEventListener('update', AnimateCameraEntry, true);
});

function AnimateCameraEntry(e)
{
  let time = camAnimCurrentTime / camAnimTotalTime;
  let easedTime = quadraticFilter(1, time);

  camera.position.lerpVectors(new THREE.Vector3(-5, 15, -7.5), new THREE.Vector3(0, 7, 0), easedTime);

  console.log(camAnimCurrentTime);
  console.log(camAnimTotalTime);
  console.log(e.deltaTime);
  
  if (camAnimCurrentTime >= camAnimTotalTime)
  {
    window.removeEventListener('update', AnimateCameraEntry, true);
  }

  camAnimCurrentTime += e.deltaTime;
}

var lastUpdate = Date.now();
Update();