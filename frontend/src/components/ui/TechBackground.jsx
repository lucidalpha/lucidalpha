import React, { useEffect, useRef } from 'react';

const TechBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // Set canvas size
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);
        handleResize();

        // Particles
        const particles = [];
        const particleCount = 40; // Reduced for cleaner look

        // Grid properties
        const gridSize = 40;

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 2;
                this.pulse = Math.random() * Math.PI; // For pulsing opacity
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0) this.x = canvas.width;
                if (this.x > canvas.width) this.x = 0;
                if (this.y < 0) this.y = canvas.height;
                if (this.y > canvas.height) this.y = 0;

                this.pulse += 0.05;
            }

            draw() {
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(Math.sin(this.pulse)) * 0.3})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        // Circuit Lines
        const lines = [];
        const lineCount = 15;

        class CircuitLine {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize;
                this.y = Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize;
                this.length = 0;
                this.maxLength = Math.random() * 200 + 50;
                this.dir = Math.floor(Math.random() * 4); // 0: up, 1: right, 2: down, 3: left
                this.speed = 2; // Fixed speed
                this.history = [{ x: this.x, y: this.y }];
                this.life = 0;
                this.maxLife = Math.random() * 100 + 100;
                this.dead = false;
            }

            update() {
                if (this.dead) return;

                this.life++;
                if (this.life > this.maxLife) {
                    this.dead = true;
                    // Respawn logic handled in loop
                    return;
                }

                // Move
                switch (this.dir) {
                    case 0: this.y -= this.speed; break;
                    case 1: this.x += this.speed; break;
                    case 2: this.y += this.speed; break;
                    case 3: this.x -= this.speed; break;
                }

                // Change direction occasionally to snap to grid
                if (this.life % 20 === 0 && Math.random() > 0.5) {
                    this.dir = Math.floor(Math.random() * 4);
                }

                this.history.push({ x: this.x, y: this.y });
                if (this.history.length > this.maxLength / this.speed) {
                    this.history.shift();
                }
            }

            draw() {
                if (this.history.length < 2) return;

                ctx.beginPath();
                ctx.moveTo(this.history[0].x, this.history[0].y);
                for (let i = 1; i < this.history.length; i++) {
                    ctx.lineTo(this.history[i].x, this.history[i].y);
                }

                // Color based on theme (Gold/Teal mix or just faint white)
                // Let's go with a faint cyan/white for the "Tech" feel, or Gold if we want to match the theme.
                // The user wanted the "Interface Feel" of the other site (Circuit/Tech).
                // I will use a very subtle Cyan/Teal to match the "Quant" feel, but desaturated.
                const gradient = ctx.createLinearGradient(
                    this.history[0].x, this.history[0].y,
                    this.history[this.history.length - 1].x, this.history[this.history.length - 1].y
                );
                gradient.addColorStop(0, 'rgba(20, 184, 166, 0)'); // Fade tail
                gradient.addColorStop(1, 'rgba(20, 184, 166, 0.3)'); // Head (Teal-500 equivalent)

                ctx.strokeStyle = gradient;
                ctx.lineWidth = 1;
                ctx.stroke();

                // Draw head
                const head = this.history[this.history.length - 1];
                ctx.fillStyle = 'rgba(20, 184, 166, 0.8)';
                ctx.beginPath();
                ctx.arc(head.x, head.y, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        for (let i = 0; i < lineCount; i++) {
            lines.push(new CircuitLine());
        }

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear but maybe leave trails? No, clear is cleaner for this style.

            // Draw faint grid
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let x = 0; x <= canvas.width; x += gridSize * 2) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
            }
            for (let y = 0; y <= canvas.height; y += gridSize * 2) {
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
            }
            ctx.stroke();

            // Particles
            particles.forEach(p => {
                p.update();
                p.draw();
            });

            // Lines
            lines.forEach((l, index) => {
                l.update();
                l.draw();
                if (l.dead) {
                    lines[index] = new CircuitLine();
                }
            });

            // Vignette (in CSS is better, but can add here if needed. CSS is better)

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1]"
            style={{ background: 'radial-gradient(circle at center, #050505 0%, #000000 100%)' }}
        />
    );
};

export default TechBackground;
