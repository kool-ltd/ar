import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { camera, renderer, scene } from './scene.js';
import { resetPartPositions } from './models.js';

export let controls;
let selectedPart = null;
let isDragging = false;
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0));
const raycaster = new THREE.Raycaster();
const touchPosition = new THREE.Vector2();
const movementOffset = new THREE.Vector3();

export function initControls() {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.1, 0);
    controls.update();
}

export function setupEventListeners() {
    // Remove default touch listeners
    renderer.domElement.removeEventListener('touchstart', renderer.domElement.__touchHandler);
    renderer.domElement.removeEventListener('touchmove', renderer.domElement.__touchHandler);
    renderer.domElement.removeEventListener('touchend', renderer.domElement.__touchHandler);

    // Add our custom touch listeners
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
    renderer.domElement.addEventListener('touchend', onTouchEnd, { passive: false });

    document.getElementById('reset-button').addEventListener('click', resetPartPositions);
}

function getIntersectedPart(event) {
    const touch = event.touches[0];
    const rect = renderer.domElement.getBoundingClientRect();
    
    touchPosition.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    touchPosition.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(touchPosition, camera);
    
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    for (let intersect of intersects) {
        let object = intersect.object;
        while (object.parent && !object.userData.type) {
            object = object.parent;
        }
        if (object.userData.type === 'movable') {
            return {
                part: object,
                point: intersect.point
            };
        }
    }
    return null;
}

function onTouchStart(event) {
    event.preventDefault();
    
    if (event.touches.length === 1) {
        const intersect = getIntersectedPart(event);
        if (intersect) {
            selectedPart = intersect.part;
            isDragging = true;
            controls.enabled = false;
            
            // Store the offset between touch point and object position
            movementOffset.copy(selectedPart.position).sub(intersect.point);
        }
    }
}

function onTouchMove(event) {
    event.preventDefault();
    
    if (!selectedPart || !isDragging) return;

    if (event.touches.length === 1) {
        const touch = event.touches[0];
        const rect = renderer.domElement.getBoundingClientRect();
        
        touchPosition.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        touchPosition.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
        
        raycaster.setFromCamera(touchPosition, camera);
        
        const intersectPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(dragPlane, intersectPoint);
        
        selectedPart.position.copy(intersectPoint.add(movementOffset));
    }
    else if (event.touches.length === 2) {
        // Rotation handling
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const angle = Math.atan2(
            touch2.clientY - touch1.clientY,
            touch2.clientX - touch1.clientX
        );
        selectedPart.rotation.y = angle;
    }
}

function onTouchEnd(event) {
    event.preventDefault();
    
    if (selectedPart) {
        isDragging = false;
        selectedPart = null;
        controls.enabled = true;
    }
}
