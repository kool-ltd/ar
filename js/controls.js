import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { camera, renderer, scene } from './scene.js';
import { resetPartPositions } from './models.js';

export let controls;
let selectedObject = null;
let isMoving = false;
const initialTouchPosition = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

export function initControls() {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.1, 0);
    controls.update();
}

export function setupEventListeners() {
    renderer.domElement.addEventListener('touchstart', onTouchStart);
    renderer.domElement.addEventListener('touchmove', onTouchMove);
    renderer.domElement.addEventListener('touchend', onTouchEnd);

    document.getElementById('reset-button').addEventListener('click', () => {
        placedModels.forEach(container => {
            resetPartPositions(container);
        });
    });
}

function findSelectedObject(x, y) {
    const touch = new THREE.Vector2();
    touch.x = (x / window.innerWidth) * 2 - 1;
    touch.y = -(y / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(touch, camera);
    
    // Get all meshes that could be selected
    const selectableMeshes = [];
    scene.traverse((object) => {
        // Check if it's a mesh and has a name that matches our parts
        if (object.isMesh && ['left', 'body', 'right'].includes(object.parent.name)) {
            selectableMeshes.push(object);
        }
    });
    
    const intersects = raycaster.intersectObjects(selectableMeshes, true);
    
    if (intersects.length > 0) {
        // Find the parent object (the part group)
        let selectedPart = intersects[0].object;
        while (selectedPart.parent && !['left', 'body', 'right'].includes(selectedPart.name)) {
            selectedPart = selectedPart.parent;
        }
        return selectedPart;
    }
    return null;
}

function onTouchStart(event) {
    event.preventDefault();
    
    if (event.touches.length === 1) {
        const touch = event.touches[0];
        isMoving = true;
        initialTouchPosition.set(touch.pageX, touch.pageY);
        
        selectedObject = findSelectedObject(touch.pageX, touch.pageY);
        if (selectedObject) {
            controls.enabled = false;
            console.log('Selected part:', selectedObject.name); // Debug logging
        }
    }
}

function onTouchMove(event) {
    event.preventDefault();

    if (!selectedObject || !isMoving) return;

    if (event.touches.length === 1) {
        const touch = event.touches[0];
        const deltaX = (touch.pageX - initialTouchPosition.x) * 0.002;
        const deltaZ = (touch.pageY - initialTouchPosition.y) * 0.002;

        // Move only the selected part
        selectedObject.position.x += deltaX;
        selectedObject.position.z += deltaZ;

        initialTouchPosition.set(touch.pageX, touch.pageY);
        
    } else if (event.touches.length === 2) {
        // Handle rotation with two fingers
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        
        const rotation = Math.atan2(
            touch2.pageY - touch1.pageY,
            touch2.pageX - touch1.pageX
        );
        
        selectedObject.rotation.y = rotation;
    }
}

function onTouchEnd(event) {
    event.preventDefault();
    isMoving = false;
    if (selectedObject) {
        controls.enabled = true;
        selectedObject = null;
    }
}
