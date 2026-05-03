import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import * as THREE from 'three';

export default function ThreeLearningScene() {
	const mountRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const mount = mountRef.current;
		if (!mount) return;

		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
		camera.position.set(0, 0.4, 7);

		const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.setClearColor(0x000000, 0);
		mount.appendChild(renderer.domElement);

		const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
		const pointLight = new THREE.PointLight(0x7dd3fc, 80, 16);
		pointLight.position.set(3, 3, 4);
		scene.add(ambientLight, pointLight);

		const core = new THREE.Mesh(
			new THREE.IcosahedronGeometry(1.08, 2),
			new THREE.MeshStandardMaterial({
				color: 0x2563eb,
				metalness: 0.25,
				roughness: 0.22,
				emissive: 0x0f766e,
				emissiveIntensity: 0.22,
			}),
		);
		scene.add(core);

		const ringMaterial = new THREE.MeshStandardMaterial({
			color: 0x14b8a6,
			metalness: 0.3,
			roughness: 0.28,
			transparent: true,
			opacity: 0.72,
		});

		const rings = [
			new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.025, 12, 160), ringMaterial),
			new THREE.Mesh(new THREE.TorusGeometry(2.75, 0.018, 12, 160), ringMaterial.clone()),
			new THREE.Mesh(new THREE.TorusGeometry(3.35, 0.014, 12, 160), ringMaterial.clone()),
		];

		rings[0].rotation.x = Math.PI / 2.8;
		rings[1].rotation.x = Math.PI / 2.15;
		rings[1].rotation.y = Math.PI / 7;
		rings[2].rotation.x = Math.PI / 1.8;
		rings[2].rotation.z = Math.PI / 8;
		rings.forEach((ring) => scene.add(ring));

		const orbitItems = [
			{ color: 0xf97316, radius: 2.05, size: 0.16, speed: 0.82 },
			{ color: 0xec4899, radius: 2.75, size: 0.13, speed: -0.62 },
			{ color: 0x84cc16, radius: 3.35, size: 0.12, speed: 0.5 },
			{ color: 0xa78bfa, radius: 2.45, size: 0.1, speed: -0.9 },
		].map((item) => {
			const mesh = new THREE.Mesh(
				new THREE.SphereGeometry(item.size, 24, 24),
				new THREE.MeshStandardMaterial({
					color: item.color,
					emissive: item.color,
					emissiveIntensity: 0.25,
					roughness: 0.2,
				}),
			);
			scene.add(mesh);
			return { ...item, mesh };
		});

		const particlesGeometry = new THREE.BufferGeometry();
		const particleCount = 120;
		const positions = new Float32Array(particleCount * 3);
		for (let i = 0; i < particleCount; i += 1) {
			positions[i * 3] = (Math.random() - 0.5) * 7;
			positions[i * 3 + 1] = (Math.random() - 0.5) * 4.5;
			positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
		}
		particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		const particles = new THREE.Points(
			particlesGeometry,
			new THREE.PointsMaterial({
				color: 0x7dd3fc,
				size: 0.025,
				transparent: true,
				opacity: 0.55,
			}),
		);
		scene.add(particles);

		const resize = () => {
			const { width, height } = mount.getBoundingClientRect();
			renderer.setSize(width, height, false);
			camera.aspect = width / Math.max(height, 1);
			camera.updateProjectionMatrix();
		};

		const resizeObserver = new ResizeObserver(resize);
		resizeObserver.observe(mount);
		resize();

		let frame = 0;
		let animationId = 0;
		const animate = () => {
			frame += 0.01;
			core.rotation.x += 0.004;
			core.rotation.y += 0.006;
			rings[0].rotation.z += 0.003;
			rings[1].rotation.z -= 0.0024;
			rings[2].rotation.z += 0.0018;
			particles.rotation.y += 0.0009;

			orbitItems.forEach((item, index) => {
				const angle = frame * item.speed + index * 1.7;
				item.mesh.position.set(
					Math.cos(angle) * item.radius,
					Math.sin(angle * 1.1) * 0.58,
					Math.sin(angle) * item.radius * 0.36,
				);
			});

			renderer.render(scene, camera);
			animationId = requestAnimationFrame(animate);
		};
		animate();

		return () => {
			cancelAnimationFrame(animationId);
			resizeObserver.disconnect();
			mount.removeChild(renderer.domElement);
			particlesGeometry.dispose();
			particles.material.dispose();
			core.geometry.dispose();
			(core.material as THREE.Material).dispose();
			rings.forEach((ring) => {
				ring.geometry.dispose();
				(ring.material as THREE.Material).dispose();
			});
			orbitItems.forEach((item) => {
				item.mesh.geometry.dispose();
				(item.mesh.material as THREE.Material).dispose();
			});
			renderer.dispose();
		};
	}, []);

	return (
		<Box
			ref={mountRef}
			sx={{
				width: '100%',
				height: { xs: 300, md: 420 },
				position: 'relative',
				'& canvas': {
					display: 'block',
					width: '100%',
					height: '100%',
				},
			}}
		/>
	);
}
