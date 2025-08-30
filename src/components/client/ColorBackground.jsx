"use client"
import React, { useEffect, useRef, useState } from 'react';

const BackgroundComponent = ({ children }) => {
    const canvasRef = useRef(null);
    const parentRef = useRef(null);
    const centerDivRef = useRef(null);



    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const parent = parentRef.current;
        if (!parent) return;

        const resizeCanvas = () => {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const colors = [
            'rgba(0, 100, 255, 0.5)',
            'rgba(255, 0, 0, 0.5)',
            'rgba(255, 165, 0, 0.5)',
            'rgba(128, 0, 128, 0.5)',
            'rgba(0, 200, 200, 0.5)'
        ];

        const rgbaToComponents = (rgba) => {
            const match = rgba.match(/rgba\((\d+), (\d+), (\d+), ([\d.]+)\)/);
            if (match) {
                return {
                    r: parseInt(match[1]),
                    g: parseInt(match[2]),
                    b: parseInt(match[3]),
                    a: parseFloat(match[4])
                };
            }
            return null;
        };

        const interpolateColor = (color1, color2, factor) => {
            const comp1 = rgbaToComponents(color1);
            const comp2 = rgbaToComponents(color2);
            if (!comp1 || !comp2) return color2;

            const r = Math.round(comp1.r + (comp2.r - comp1.r) * factor);
            const g = Math.round(comp1.g + (comp2.g - comp1.g) * factor);
            const b = Math.round(comp1.b + (comp2.b - comp1.b) * factor);
            const a = comp1.a + (comp2.a - comp1.a) * factor;

            return `rgba(${r}, ${g}, ${b}, ${a})`;
        };

        class Circle {
            constructor(colorIndex) {
                this.radius = 175;
                this.x = canvas.width / 2 + (Math.random() - 0.5) * 50; 
                this.y = canvas.height / 2 + (Math.random() - 0.5) * 50;
                
                this.currentColorIndex = colorIndex;
                this.nextColorIndex = (colorIndex + 1) % colors.length;
                this.currentColor = colors[this.currentColorIndex];
                this.targetColor = colors[this.nextColorIndex];
                this.transitionProgress = 0;
                this.transitionSpeed = 0.005;

                this.initialSpeed = 1.8 + Math.random() * 1.7;
                this.vx = 0; 
                this.vy = 0; 
                this.lastColorChangeTime = Date.now();
                this.colorChangeInterval = 2000;
                this.isTransitioning = false;
                this.currentBlur = 0;
            }

            update(mouse) {
                if (Date.now() - this.lastColorChangeTime > this.colorChangeInterval && !this.isTransitioning) {
                    this.isTransitioning = true;
                    this.currentColorIndex = this.nextColorIndex;
                    this.nextColorIndex = (this.nextColorIndex + 1) % colors.length;
                    this.targetColor = colors[this.nextColorIndex];
                    this.transitionProgress = 0;
                    this.lastColorChangeTime = Date.now();
                }

                if (this.isTransitioning) {
                    this.transitionProgress += this.transitionSpeed;
                    this.currentColor = interpolateColor(colors[this.currentColorIndex], this.targetColor, this.transitionProgress);
                    if (this.transitionProgress >= 1) {
                        this.isTransitioning = false;
                        this.currentColor = this.targetColor;
                    }
                }

                if (mouse.x !== null && mouse.y !== null) {
                    const rect = canvas.getBoundingClientRect();
                    const mouseX = mouse.x - rect.left;
                    const mouseY = mouse.y - rect.top;

                    const dx = this.x - mouseX;
                    const dy = this.y - mouseY;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 200) {
                        const angle = Math.atan2(dy, dx);
                        const force = Math.min(30, (200 - distance) / 5);
                        this.vx = Math.cos(angle) * force;
                        this.vy = Math.sin(angle) * force;
                    }
                }

                // New Logic: Attraction to the central div
                const centerDiv = centerDivRef.current;
                if (centerDiv) {
                    const rect = centerDiv.getBoundingClientRect();
                    const divX = rect.left - canvas.getBoundingClientRect().left + rect.width / 2;
                    const divY = rect.top - canvas.getBoundingClientRect().top + rect.height / 2;

                    const dxCenter = divX - this.x;
                    const dyCenter = divY - this.y;
                    const distanceCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter);

                    const attractionStrength = distanceCenter / 8000;
                    this.vx += dxCenter * attractionStrength;
                    this.vy += dyCenter * attractionStrength;
                }
                
                // Keep the attraction to canvas center, it's good to have this to prevent circles flying off
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                const dxCanvasCenter = centerX - this.x;
                const dyCanvasCenter = centerY - this.y;
                const distanceCanvasCenter = Math.sqrt(dxCanvasCenter * dxCanvasCenter + dyCanvasCenter * dyCanvasCenter);
                const attractionStrengthCanvas = distanceCanvasCenter / 8000;
                this.vx += dxCanvasCenter * attractionStrengthCanvas;
                this.vy += dyCanvasCenter * attractionStrengthCanvas;
                
                const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                if (currentSpeed > this.initialSpeed) {
                    this.vx *= 0.98;
                    this.vy *= 0.98;
                }
                this.x += this.vx;
                this.y += this.vy;

                if (this.x > canvas.width + this.radius) this.x = -this.radius;
                else if (this.x < -this.radius) this.x = canvas.width + this.radius;
                if (this.y > canvas.height + this.radius) this.y = -this.radius;
                else if (this.y < -this.radius) this.y = canvas.height + this.radius;
            }
        }

        const circles = [];
        for (let i = 0; i < 5; i++) {
            circles.push(new Circle(i));
        }

        const mouse = { x: null, y: null };
        const handleMouseMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
        const handleMouseLeave = () => { mouse.x = null; mouse.y = null; };

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        let animationFrameId;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            circles.forEach(circle => {
                circle.update(mouse);

                let blurAmount = 0;
                const interactionRadius = 200; 
                const maxBlur = 130; 

                if (mouse.x !== null && mouse.y !== null) {
                    const distanceToMouse = Math.sqrt(
                        Math.pow(circle.x - mouse.x, 2) + Math.pow(circle.y - mouse.y, 2)
                    );

                    if (distanceToMouse < interactionRadius) {
                        const mouseBlur = maxBlur - (distanceToMouse / interactionRadius) * maxBlur;
                        blurAmount = Math.max(blurAmount, mouseBlur);
                    }
                }
                
                const centerDiv = centerDivRef.current;
                if (centerDiv) {
                    const rect = centerDiv.getBoundingClientRect();
                    const divX = rect.left - canvas.getBoundingClientRect().left + rect.width / 2;
                    const divY = rect.top - canvas.getBoundingClientRect().top + rect.height / 2;
                    const distanceToDiv = Math.sqrt(Math.pow(circle.x - divX, 2) + Math.pow(circle.y - divY, 2));

                    const divBlurRadius = 350; 
                    if (distanceToDiv < divBlurRadius) {
                        const divBlur = maxBlur - (distanceToDiv / divBlurRadius) * maxBlur;
                        blurAmount = Math.max(blurAmount, divBlur); 
                    }
                }

                circle.currentBlur = circle.currentBlur || 0;
                circle.currentBlur += (blurAmount - circle.currentBlur) * 0.1;

                ctx.filter = `blur(${circle.currentBlur}px)`;

                ctx.beginPath();
                ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
                ctx.fillStyle = circle.currentColor;
                ctx.fill();
            });

            ctx.filter = 'none';
            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div ref={parentRef} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
            <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
            <div 
                ref={centerDivRef}
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1, 
                    color: 'white',
                    textAlign: 'center'
                }}
            >
                {children} 
            </div>
        </div>
    );
};

export default BackgroundComponent;