import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { camera, renderer, scene } from './scene.js';
import { resetPartPositions, models } from './models.js';

export let controls;
let selectedObject = null;
let isMoving = false;
const initialTouchPosition = new THREE.Vector2();

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
    const raycaster = new THREE.Raycaster();
    const touch = new THREE.Vector2();
    
    touch.x = (x / window.innerWidth) * 2 - 1;
    touch.y = -(y / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(touch, camera);
    
    // Create array of all meshes from each part
    const selectableParts = [];
    scene.traverse((object) => {
        if (object.isMesh) {
            // Check if this mesh belongs to one of our parts
            const partNames = ['blade', 'frame', 'handguard', 'handle'];
            for (const name of partNames) {
                if (object.parent && object.parent.name === name) {
                    selectableParts.push(object);
                    break;
                }
            }
        }
    });

    const intersects = raycaster.intersectObjects(selectableParts, false);
    
    if (intersects.length > 0) {
        // Find the root part object (blade, frame, handguard, or handle)
        let object = intersects[0].object;
        while (object.parent && object.parent !== scene) {
            object = object.parent;
        }
        return object;
    }
    return null;
}

function onTouchStart(event) {
    event.preventDefault();
    
    if (event.touches.length === 1) {
        const touch = event.touches[0];
        isMoving = true;
        initialTouchPosition.set(touch.pageX, touch.pageY);
        
        const newSelectedObject = findSelectedObject(touch.pageX, touch.pageY);
        if (newSelectedObject) {
            selectedObject = newSelectedObject;
            controls.enabled = false;
            console.log('Selected part:', selectedObject.name); // Debug log
        }
    }
}

function onTouchMove(event) {
    event.preventDefault();

    if (!selectedObject || !isMoving) return;

    if (event.touches.length === 1) {
        const touch = event.touches[0];
        const deltaX = (touch.pageX - initialTouchPosition.x) * 0.01;
        const deltaZ = (touch.pageY - initialTouchPosition.y) * 0.01;

        // Move the selected part
        selectedObject.position.x += deltaX;
        selectedObject.position.z += deltaZ;

        initialTouchPosition.set(touch.pageX, touch.pageY);
        
    } else if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        
        // Calculate rotation based on two-finger gesture
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
