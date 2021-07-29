export class DinoGame {
	constructor(options = {}) {
		this.defaults = {
			loopTime: 10,
			gameSpeed: 6,
			// gameMaxSpeed: 4,
			// gameAcceleration: 1.2,
			minLeft: 0,
			maxLeft: 1200,
			minTop: 0,
			maxTop: 700,
			jumpHeight: 200,
			jumpSpeed: 15,
			jumpTime: 25,
			dinoJumpKey: "Space",
			cactusMaxHeight: 100,
			cactusMinHeight: 50,
			maxScore: 999999999,
		};
		this.audios = {
			click: {
				path: "./sound/click.mp3",
			},
			jump: {
				path: "./sound/dino_jump.wav",
				volume: 0.4,
			},
			die: {
				path: "./sound/dino_die.wav",
				volume: 0.4,
			},
		};
		this.gameBackground = document.querySelector(".background");
		this.menu = this.gameBackground.querySelector(".menu");
		this.dino = this.gameBackground.querySelector(".dino");
		this.dinoOffsetTop = this.dino.offsetTop;
		this.scoreElement = this.gameBackground.querySelector(".score");
		this.cactus = [];
		this.dinoIsDead = true;
		this.backgroundPositionX = parseInt(
			window
				.getComputedStyle(this.gameBackground)
				.getPropertyValue("background-position-x")
		);
		this.options = JSON.parse(
			JSON.stringify(Object.assign({}, this.defaults, options))
		);
		this.init();
	}
	init() {
		this.dinoIdle();
		this.createAudios();
		this.gameBackground
			.querySelector(".start")
			.addEventListener("click", () => {
				this.playAudio(this.audios.click);
				this.start();
			});
		document.addEventListener("keydown", (e) => {
			if (e.code === this.options.dinoJumpKey) {
				e.preventDefault();
				this.dinoJump();
			}
		});
	}
	start() {
		this.cactus.forEach((cactus) => {
			cactus.remove();
		});
		this.cactus = [];
		this.score = 0;
		this.dinoIsDead = false;
		this.showElement(this.scoreElement.parentNode);
		this.refreshScore();
		this.dinoRun();
		this.setCactus();
		this.hideElement(this.menu);
		this.gameTimeInterval = setInterval(() => {
			// move background
			this.gameBackground.style.backgroundPositionX =
				(this.backgroundPositionX -= this.options.gameSpeed) + "px";

			// cactus
			this.cactus.forEach((currentCactus) => {
				// move cactus
				const cactusLeft = currentCactus.offsetLeft - this.options.gameSpeed;
				currentCactus.style.left = `${cactusLeft}px`;
				if (cactusLeft < this.options.minLeft - currentCactus.offsetWidth) {
					currentCactus.remove();
					this.cactus.shift();
					this.refreshScore(++this.score);
				}
				if (cactusLeft <= this.options.maxLeft / 2 && this.cactus.length < 2) {
					this.setCactus();
				}

				// collision between dino and cactus
				currentCactus.querySelectorAll(".cactus-item").forEach((cactusItem) => {
					if (
						this.testCollision(
							{
								element: this.dino,
								adjusts: { left: -20, right: -50, bottom: -50 },
							},
							{ element: cactusItem }
						)
					) {
						this.gameOver();
					}
				});
			});
		}, this.options.loopTime);
	}
	dinoIdle() {
		this.dino.classList.remove(...["run", "jump", "death"]);
		this.dino.classList.add("idle");
	}
	dinoRun() {
		this.dino.classList.remove(...["idle", "jump", "death"]);
		this.dino.classList.add("run");
	}
	dinoDeath() {
		this.dino.classList.remove(...["idle", "jump", "run"]);
		this.dino.classList.add("death");
		this.playAudio(this.audios.die);
	}
	dinoJump() {
		if (this.jumpInterval || this.dinoIsDead) return;
		let up = true;
		const jumpMaxTop = this.dinoOffsetTop;
		const jumpMinTop = this.dinoOffsetTop - this.options.jumpHeight;
		this.playAudio(this.audios.jump);
		this.jumpInterval = setInterval(() => {
			if (this.dinoIsDead) up = false;
			let top = this.dino.offsetTop + (up ? -1 : 1) * this.options.jumpSpeed;
			if (top <= jumpMinTop) {
				top = jumpMinTop;
				up = false;
			}
			if (top >= jumpMaxTop) {
				top = jumpMaxTop;
				clearInterval(this.jumpInterval);
				this.jumpInterval = null;
				if (!this.dinoIsDead) this.dinoRun();
			}
			this.dino.style.top = `${top}px`;
		}, this.options.jumpTime);
		this.dino.classList.remove(...["idle", "run", "death"]);
		this.dino.classList.add("jump");
	}
	setCactus() {
		const cactus = document.createElement("div");
		cactus.classList.add("cactus"); //cactus group
		for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
			const cactusItem = document.createElement("div");
			cactusItem.classList.add("cactus-item");
			cactus.appendChild(cactusItem);
			const cactusHeight = Math.floor(
				Math.random() *
					(this.options.cactusMaxHeight - this.options.cactusMinHeight + 1) +
					this.options.cactusMinHeight
			);
			cactusItem.style.height = `${cactusHeight}px`;
			cactusItem.style.left = `${
				this.options.maxLeft + i * cactus.offsetWidth
			}px`;
		}
		cactus.style.left = `${this.options.maxLeft + cactus.offsetWidth}px`;
		this.gameBackground.append(cactus);
		this.cactus.push(cactus);
	}
	refreshScore(score) {
		this.score = score || 0;
		this.scoreElement.textContent = this.score
			.toString()
			.padStart(this.options.maxScore.toString().length, "0");
	}
	gameOver() {
		this.dinoIsDead = true;
		clearInterval(this.gameTimeInterval);
		this.gameTimeInterval = null;
		this.dinoDeath();
		this.menu.querySelector(
			"h3"
		).textContent = `Seus pontos: ${this.scoreElement.textContent}`;
		this.showElement(this.menu);
	}
	testCollision(el1 = {}, el2 = {}, direction) {
		if (
			!el1.element ||
			!el2.element ||
			!el1.element.getClientRects().length ||
			!el2.element.getClientRects().length
		)
			return;
		const adjusts = {
			top: 0,
			right: 0,
			left: 0,
			bottom: 0,
		};

		el1.adjusts = Object.assign({}, adjusts, el1.adjusts);
		el2.adjusts = Object.assign({}, adjusts, el2.adjusts);

		const el1Rects = JSON.parse(
			JSON.stringify(el1.element.getClientRects()[0])
		);
		const el2Rects = JSON.parse(
			JSON.stringify(el2.element.getClientRects()[0])
		);

		Object.keys(adjusts).forEach((key) => {
			el1Rects[key] += el1.adjusts[key];
			el2Rects[key] += el2.adjusts[key];
		});

		const leftObject = el1Rects.left <= el2Rects.left ? el1Rects : el2Rects;
		const rightObject = leftObject === el1Rects ? el2Rects : el1Rects;
		const topObject = el1Rects.top <= el2Rects.top ? el1Rects : el2Rects;
		const bottomObject = topObject === el1Rects ? el2Rects : el1Rects;
		switch (direction) {
			case "vertical":
				if (leftObject.right >= rightObject.left) return true;
				break;
			case "vertical-top":
				if (leftObject.right >= rightObject.left && topObject === el1Rects)
					return true;
				break;
			case "vertical-bottom":
				if (leftObject.right >= rightObject.left && bottomObject === el1Rects)
					return true;
				break;
			case "horizontal":
				if (topObject.bottom >= bottomObject.top) return true;
				break;
			case "horizontal-left":
				if (topObject.bottom >= bottomObject.top && leftObject === el1Rects)
					return true;
				break;
			case "horizontal-rigth":
				if (topObject.bottom >= bottomObject.top && rightObject === el1Rects)
					return true;
				break;
			default:
				if (
					leftObject.right >= rightObject.left &&
					topObject.bottom >= bottomObject.top
				)
					return true;
		}
		return false;
	}
	hideElement(element) {
		element.classList.add("hide");
	}
	showElement(element) {
		element.classList.remove("hide");
	}
	playAudio(audioOptions) {
		const audio = audioOptions.audio;
		audio.pause();
		audio.currentTime = 0;
		setTimeout(() => audio.play(), 10);
	}
	createAudios() {
		Object.keys(this.audios).forEach((key) => {
			const audioOptions = this.audios[key];
			const audio = new Audio(audioOptions.path);
			if (audioOptions.loop) audio.loop = true;
			if (audioOptions.volume != null) audio.volume = audioOptions.volume;
			this.audios[key].audio = audio;
		});
	}
}
