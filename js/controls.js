import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { camera, renderer, scene } from './scene.js';
import { resetPartPositions } from './models.js';

export let controls;
let selectedObject = null;
let isMoving = false;
const initialTouchPosition = new THREE.Vector2();
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0));
const dragOffset = new THREE.Vector3();

export function initControls() {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.1, 0);
    controls.update();
    
    // Disable OrbitControls when interacting with objects
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.enableZoom = true;
}

export function setupEventListeners() {
    renderer.domElement.addEventListener('touchstart', onTouchStart, false);
    renderer.domElement.addEventListener('touchmove', onTouchMove, false);
    renderer.domElement.addEventListener('touchend', onTouchEnd, false);

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
    
    // Get all interactive objects in the scene
    const interactiveObjects = [];
    scene.traverse((object) => {
        if (object.isMesh || object.isGroup) {
            interactiveObjects.push(object);
        }
    });
    
    const intersects = raycaster.intersectObjects(interactiveObjects, true);
    
    if (intersects.length > 0) {
        let object = intersects[0].object;
        
        // Traverse up the parent hierarchy until we find the main part
        while (object.parent && !['blade', 'frame', 'handguard', 'handle'].includes(object.name)) {
            object = object.parent;
        }
        
        return object;
    }
    return null;
}

function onTouchStart(event) {
    event.preventDefault();
    
    if (event.touches.length === 1) {
        isMoving = true;
        const touch = event.touches[0];
        initialTouchPosition.set(touch.pageX, touch.pageY);
        
        selectedObject = findSelectedObject(touch.pageX, touch.pageY);
        
        if (selectedObject) {
            controls.enabled = false;
            
            // Store the offset between touch point and object position
            const raycaster = new THREE.Raycaster();
            const touchPoint = new THREE.Vector2(
                (touch.pageX / window.innerWidth) * 2 - 1,
                -(touch.pageY / window.innerHeight) * 2 + 1
            );
            raycaster.setFromCamera(touchPoint, camera);
            
            const intersectPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(dragPlane, intersectPoint);
            dragOffset.subVectors(selectedObject.position, intersectPoint);
        }
    }
}

function onTouchMove(event) {
    event.preventDefault();

    if (!selectedObject) return;

    if (event.touches.length === 1 && isMoving) {
        const touch = event.touches[0];
        const raycaster = new THREE.Raycaster();
        const touchPoint = new THREE.Vector2(
            (touch.pageX / window.innerWidth) * 2 - 1,
            -(touch.pageY / window.innerHeight) * 2 + 1
        );
        raycaster.setFromCamera(touchPoint, camera);
        
        const intersectPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(dragPlane, intersectPoint);
        
        // Apply the stored offset to maintain relative position
        selectedObject.position.copy(intersectPoint.add(dragOffset));
        
    } else if (event.touches.length === 2) {
        // Handle rotation with two fingers
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        
        const rotation = Math.atan2(
            touch2.pageY - touch1.pageY,
            touch2.pageX - touch1.pageX
        );
        
        if (selectedObject) {
            selectedObject.rotation.y = rotation;
        }
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

export function updateControls() {
    if (controls) {
        controls.update();
    }
}
