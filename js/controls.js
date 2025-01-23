import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { camera, renderer, scene } from './scene.js';
import { resetPartPositions } from './models.js';

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
    
    // Get all interactable objects
    const allParts = [];
    scene.traverse((object) => {
        // Check if the object is a mesh and has one of our part names
        if (object instanceof THREE.Mesh && 
            ['blade', 'frame', 'handguard', 'handle'].includes(object.parent.name)) {
            allParts.push(object.parent);
        }
    });
    
    const intersects = raycaster.intersectObjects(allParts, true);
    if (intersects.length > 0) {
        let object = intersects[0].object;
        // Traverse up to find the named parent
        while (object.parent && !['blade', 'frame', 'handguard', 'handle'].includes(object.name)) {
            object = object.parent;
        }
        return object;
    }
    return null;
}

function onTouchStart(event) {
    event.preventDefault(); // Prevent default touch behavior
    
    if (event.touches.length === 1) {
        isMoving = true;
        initialTouchPosition.set(
            event.touches[0].pageX,
            event.touches[0].pageY
        );
        
        const found = findSelectedObject(event.touches[0].pageX, event.touches[0].pageY);
        if (found) {
            selectedObject = found;
            controls.enabled = false; // Disable orbit controls when manipulating parts
        }
    }
}

function onTouchMove(event) {
    event.preventDefault();

    if (!selectedObject) return;

    if (isMoving && event.touches.length === 1) {
        const touch = event.touches[0];
        const deltaX = (touch.pageX - initialTouchPosition.x) * 0.002;
        const deltaZ = (touch.pageY - initialTouchPosition.y) * 0.002;

        // Update position relative to world coordinates
        const matrix = new THREE.Matrix4();
        matrix.extractRotation(camera.matrixWorld);

        const moveX = new THREE.Vector3();
        const moveZ = new THREE.Vector3();
        matrix.extractBasis(moveX, new THREE.Vector3(), moveZ);

        selectedObject.position.add(moveX.multiplyScalar(deltaX));
        selectedObject.position.add(moveZ.multiplyScalar(deltaZ));

        initialTouchPosition.set(touch.pageX, touch.pageY);
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
    selectedObject = null;
    controls.enabled = true; // Re-enable orbit controls
}

// Add window resize handler
window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});
