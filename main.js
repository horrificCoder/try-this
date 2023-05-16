import * as THREE from 'three';
import * as faceapi from 'face-api.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const eyeglassModelPath = './eyeglas.glb';


// Define scene and perspective camera and final renderer 
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: overlay, alpha: true });

// Constants
var object = [];
const videoRef = document.getElementById("inputVideo");
camera.position.z = 5;

// Load 3D model function
async function loadGlass() {
    const loader = new GLTFLoader();

    loader.load('./eyeglas.glb', function (gltf) {


        //scene.background = new THREE.Color(0xff0000);

        object[0] = gltf.scene;
       // console.log(object[0]);

        //object[0].scale.set(35,35,35);
        // object[0].position.set(0, 0, -5);
        object[0].scale.set(1, 1, 1);
        // object[0].position.set(15, 0, 0)

        scene.add(object[0]);

        // scene.add( gltf.scene );


    }, undefined, function (error) {

        console.error(error);

    });

}



async function animate() {

    requestAnimationFrame(animate);
    if (object[0] != undefined) {

        const result = await faceapi.detectAllFaces(videoRef,
            new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();

        if ( result ) {
            const canvasRef = document.getElementById("overlay");
            const dims = faceapi.matchDimensions(canvasRef, videoRef, true)
            const resizedResult = faceapi.resizeResults(result, dims)

            let canvasWidth = 1280;
            let canvasHeight = 720;

            if (resizedResult) {
                const faceLandmarks = resizedResult[0].landmarks;

                const glassesModel = object[0];

                // Get the dimensions of the glasses model
                const glassesBox = new THREE.Box3().setFromObject(glassesModel);
                const glassesSize = new THREE.Vector3();
                glassesBox.getSize(glassesSize);

                // console.log("Sadmaosdnmas")
                // console.log(glassesBox)

                // Get the position and rotation of the face landmarks
                const nosePos = getLandmarkCenter(faceLandmarks.getNose());
                const leftEyePos = getLandmarkCenter(faceLandmarks.getLeftEye());
                const rightEyePos = getLandmarkCenter(faceLandmarks.getRightEye());
                const faceAngle = Math.atan2(rightEyePos.y - leftEyePos.y, rightEyePos.x - leftEyePos.x);




                // console.log(
                    // "NODES"
                // );
                // console.log(rightEyePos);
                // Set the position and rotation of the glasses model
                //object[0].position.set(nosePos.x, nosePos.y, nosePos.z);
                object[0].rotation.set(0, -faceAngle, 0);

                // Scale the glasses model to fit the face
                const scaleFactor = glassesSize.x / (distanceTo(rightEyePos, leftEyePos));
                // object[0].scale.set(scaleFactor, scaleFactor, scaleFactor);

                const desiredWidth = distanceTo(rightEyePos, leftEyePos) * 0.8;
                //scaleFactor = 

                object[0].visible = true;

                // console.log("Scale factor:: " );
                // console.log(scaleFactor)

                // console.log("jdasndasjko");

                // console.log(object[0]);
                renderer.setSize(canvasWidth, canvasHeight);

            }
           
        }

    }


    renderer.render(scene, camera);
}

function estimateAverageFrameWidth(eyeglassesModel) {
    // Assuming the eyeglasses model is a THREE.Object3D containing multiple objects or meshes
  
    // Accumulate the total width and count of frames
    let totalWidth = 0;
    let frameCount = 0;
  
    // Traverse through all the children objects in the eyeglasses model
    eyeglassesModel.traverse((object) => {
      // Assuming the eyeglasses frames are identified by a specific property or name, adjust the condition as needed
      if (object.isMesh && object.name.includes('frame')) {
        // Calculate the bounding box of the frame mesh
        const boundingBox = new THREE.Box3().setFromObject(object);
        const frameWidth = boundingBox.getSize().x;
  
        // Accumulate the total width and increment the frame count
        totalWidth += frameWidth;
        frameCount++;
      }
    });
  
    // Calculate the average frame width
    const averageFrameWidth = totalWidth / frameCount;
  
    return averageFrameWidth;
  }
  
  


function distanceTo(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y- point2.y;
    //const dz = point1.z - point2.z;
    return Math.sqrt(dx * dx + dy * dy );
}



async function loadModels() {

    faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    faceapi.nets.faceLandmark68Net.loadFromUri("/models");
    faceapi.nets.faceRecognitionNet.loadFromUri("/models");
    faceapi.nets.faceExpressionNet.loadFromUri("/models");
}



function startVideo() {

    navigator.mediaDevices.getUserMedia({ video: true })
        .then((currentStream) => {
            videoRef.srcObject = currentStream
        })
        .catch((err) => {
            console.log(err)
        })

}

let toAdd = false;

async function onPlay() {


    // setInterval(async () => {

    const result = await faceapi.detectAllFaces(videoRef,
        new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();

    if (result) {
        const canvasRef = document.getElementById("overlay");
        const dims = faceapi.matchDimensions(canvasRef, videoRef, true)
        const resizedResult = faceapi.resizeResults(result, dims)
    }

    // }, 1000 / 30)
}

function getLandmarkCenter(landmarks) {
    const x = landmarks.reduce((sum, landmark) => sum + landmark.x, 0) / landmarks.length
    const y = landmarks.reduce((sum, landmark) => sum + landmark.y, 0) / landmarks.length
    return new THREE.Vector2(x - 320 , y - 240)
}






Promise.all(
    loadGlass(),
    loadModels(),
    startVideo(),
    onPlay(),
).then(animate());





