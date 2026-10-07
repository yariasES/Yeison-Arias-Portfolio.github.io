// Fondo interactivo de la sección Enfoque
        function initExpertiseMoodField() {
            const section = document.querySelector('#expertise');
            const canvas = section?.querySelector('.expertise-canvas');
            const gl = canvas?.getContext('webgl', {
                alpha: false,
                antialias: false,
                depth: false,
                stencil: false
            });

            if (!section || !canvas) return;
            if (!gl) {
                console.warn('MoodField: WebGL no está disponible; se mostrará el fondo estático.');
                return;
            }

            const vertexSource = `
                attribute vec2 aPos;
                void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
            `;

            const fragmentSource = `
                precision highp float;
                uniform vec2 iResolution;
                uniform vec2 iMouse;
                uniform float iTime;
                uniform float uEmotion;
                uniform vec3 uIntense;
                uniform vec3 uCalm;
                uniform vec3 uBg;
                uniform float uScale;
                uniform float uWarp;
                uniform float uRidge;
                uniform float uContrast;
                uniform float uReach;
                uniform float uPointer;

                const mat2 R2 = mat2(0.80, 0.60, -0.60, 0.80);

                float hash21(vec2 p) {
                    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
                }

                float vnoise(vec2 p) {
                    vec2 i = floor(p);
                    vec2 f = fract(p);
                    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
                    float a = hash21(i);
                    float b = hash21(i + vec2(1.0, 0.0));
                    float c = hash21(i + vec2(0.0, 1.0));
                    float d = hash21(i + vec2(1.0, 1.0));
                    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
                }

                float fbm(vec2 p) {
                    float sum = 0.0;
                    float amp = 0.5;
                    float norm = 0.0;
                    for (int i = 0; i < 4; i++) {
                        float v = vnoise(p);
                        v = mix(v, abs(v * 2.0 - 1.0), uRidge);
                        sum += amp * v;
                        norm += amp;
                        p = R2 * p * 2.03 + 7.13;
                        amp *= 0.5;
                    }
                    return sum / max(norm, 1e-4);
                }

                void main() {
                    float h = max(iResolution.y, 1.0);
                    vec2 sp = (gl_FragCoord.xy - 0.5 * iResolution) / h;
                    vec2 mp = (iMouse - 0.5 * iResolution) / h;
                    float reach = max(uReach / h, 1e-4);
                    vec2 d = sp - mp;
                    float r = length(d);
                    float influence = uPointer * exp(-(r * r) / (reach * reach));
                    float angle = influence * 1.57;
                    float cs = cos(angle);
                    float sn = sin(angle);
                    sp = mp + mat2(cs, -sn, sn, cs) * d;
                    sp += d * (influence * 0.30) / max(r, 1e-3);

                    float time = iTime * mix(1.55, 0.55, uEmotion);
                    vec2 p = sp * uScale;
                    vec2 q = vec2(
                        fbm(p + vec2(0.0, time * 0.16)),
                        fbm(p + vec2(5.2, 1.3) - vec2(time * 0.12, 0.0))
                    );
                    float field = fbm(p + uWarp * (1.0 - 0.3 * uEmotion) * q + vec2(time * 0.05, -time * 0.04));
                    float value = clamp(pow(clamp(field, 0.0, 1.0), uContrast) + influence * 0.22, 0.0, 1.0);
                    vec3 mood = mix(uIntense, uCalm, uEmotion);
                    vec3 color = mix(uBg, mood, smoothstep(0.12, 0.92, value));
                    color += mood * pow(value, 5.0) * 0.9;
                    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
                }
            `;

            function compileShader(type, source) {
                const shader = gl.createShader(type);
                if (!shader) {
                    console.error('MoodField: No se pudo crear un shader WebGL.');
                    return null;
                }
                gl.shaderSource(shader, source);
                gl.compileShader(shader);
                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    console.error('MoodField: Error al compilar shader:', gl.getShaderInfoLog(shader));
                    gl.deleteShader(shader);
                    return null;
                }
                return shader;
            }

            const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
            const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
            if (!vertexShader || !fragmentShader) {
                if (vertexShader) gl.deleteShader(vertexShader);
                if (fragmentShader) gl.deleteShader(fragmentShader);
                return;
            }

            const program = gl.createProgram();
            if (!program) {
                console.error('MoodField: No se pudo crear el programa WebGL.');
                gl.deleteShader(vertexShader);
                gl.deleteShader(fragmentShader);
                return;
            }
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.error('MoodField: Error al enlazar el programa:', gl.getProgramInfoLog(program));
                gl.deleteProgram(program);
                return;
            }

            gl.useProgram(program);
            const buffer = gl.createBuffer();
            if (!buffer) {
                console.error('MoodField: No se pudo crear el buffer WebGL.');
                gl.deleteProgram(program);
                return;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
            const position = gl.getAttribLocation(program, 'aPos');
            gl.enableVertexAttribArray(position);
            gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

            const uniforms = {
                resolution: gl.getUniformLocation(program, 'iResolution'),
                mouse: gl.getUniformLocation(program, 'iMouse'),
                time: gl.getUniformLocation(program, 'iTime'),
                emotion: gl.getUniformLocation(program, 'uEmotion'),
                intense: gl.getUniformLocation(program, 'uIntense'),
                calm: gl.getUniformLocation(program, 'uCalm'),
                background: gl.getUniformLocation(program, 'uBg'),
                scale: gl.getUniformLocation(program, 'uScale'),
                warp: gl.getUniformLocation(program, 'uWarp'),
                ridge: gl.getUniformLocation(program, 'uRidge'),
                contrast: gl.getUniformLocation(program, 'uContrast'),
                reach: gl.getUniformLocation(program, 'uReach'),
                pointer: gl.getUniformLocation(program, 'uPointer')
            };

            const palettes = {
                light: {
                    background: [232 / 255, 238 / 255, 247 / 255],
                    intense: [24 / 255, 116 / 255, 205 / 255],
                    calm: [160 / 255, 212 / 255, 1],
                    scale: 0.836,
                    warp: 1.2,
                    turbulence: 0.38,
                    contrast: 1.75,
                    reach: 260
                },
                dark: {
                    background: [10 / 255, 17 / 255, 31 / 255],
                    intense: [0, 253 / 255, 1],
                    calm: [24 / 255, 116 / 255, 205 / 255],
                    scale: 0.836,
                    warp: 1.2,
                    turbulence: 0.38,
                    contrast: 1.75,
                    reach: 260
                }
            };
            let activePalette = document.body.classList.contains('dark-mode') ? palettes.dark : palettes.light;
            const pointer = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5, active: 0, targetActive: 0 };
            const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const maxDpr = 1.5;
            let width = 0;
            let height = 0;
            let clock = 0;
            let lastFrame = 0;
            let animationFrame = 0;

            function resize() {
                const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
                const nextWidth = Math.max(1, Math.round(section.clientWidth * dpr));
                const nextHeight = Math.max(1, Math.round(section.clientHeight * dpr));
                if (nextWidth === width && nextHeight === height) return;
                width = nextWidth;
                height = nextHeight;
                canvas.width = width;
                canvas.height = height;
                gl.viewport(0, 0, width, height);
                if (reducedMotion) draw(performance.now());
            }

            function draw(now) {
                const delta = lastFrame ? Math.min(0.1, Math.max(0, (now - lastFrame) / 1000)) : 0;
                lastFrame = now;
                clock += delta;
                const easing = 1 - Math.pow(1 - 0.18, delta * 60);
                pointer.x += (pointer.targetX - pointer.x) * easing;
                pointer.y += (pointer.targetY - pointer.y) * easing;
                pointer.active += (pointer.targetActive - pointer.active) * easing;

                gl.uniform2f(uniforms.resolution, width, height);
                gl.uniform2f(uniforms.mouse, pointer.x * width, (1 - pointer.y) * height);
                gl.uniform1f(uniforms.time, clock);
                gl.uniform1f(uniforms.emotion, 1);
                gl.uniform3fv(uniforms.intense, activePalette.intense);
                gl.uniform3fv(uniforms.calm, activePalette.calm);
                gl.uniform3fv(uniforms.background, activePalette.background);
                gl.uniform1f(uniforms.scale, activePalette.scale);
                gl.uniform1f(uniforms.warp, activePalette.warp * 0.7);
                gl.uniform1f(uniforms.ridge, Math.min(1, activePalette.turbulence * 0.3));
                gl.uniform1f(uniforms.contrast, activePalette.contrast);
                gl.uniform1f(uniforms.reach, activePalette.reach * height / Math.max(section.clientHeight, 1));
                gl.uniform1f(uniforms.pointer, pointer.active);
                gl.drawArrays(gl.TRIANGLES, 0, 3);
            }

            function animate(now) {
                if (document.hidden) {
                    animationFrame = 0;
                    return;
                }
                draw(now);
                if (!reducedMotion) animationFrame = window.requestAnimationFrame(animate);
            }

            function startAnimation() {
                if (document.hidden) return;
                if (reducedMotion) {
                    draw(performance.now());
                } else if (!animationFrame) {
                    animationFrame = window.requestAnimationFrame(animate);
                }
            }

            document.addEventListener('portfolio-theme-change', event => {
                activePalette = event.detail.dark ? palettes.dark : palettes.light;
                if (reducedMotion) draw(performance.now());
            });

            section.addEventListener('pointermove', event => {
                const bounds = section.getBoundingClientRect();
                pointer.targetX = (event.clientX - bounds.left) / Math.max(bounds.width, 1);
                pointer.targetY = (event.clientY - bounds.top) / Math.max(bounds.height, 1);
                pointer.targetActive = 1;
            });
            section.addEventListener('pointerleave', () => { pointer.targetActive = 0; });
            document.addEventListener('visibilitychange', () => {
                if (document.hidden && animationFrame) {
                    window.cancelAnimationFrame(animationFrame);
                    animationFrame = 0;
                } else {
                    startAnimation();
                }
            });

            new ResizeObserver(resize).observe(section);
            resize();
            startAnimation();
        }

        initExpertiseMoodField();
