import Phaser from "phaser";
import cactusesBig1 from "./assets/cactuses_big_1.png";
import cactusesBig2 from "./assets/cactuses_big_2.png";
import cactusesBig3 from "./assets/cactuses_big_3.png";
import cactusesSmall1 from "./assets/cactuses_small_1.png";
import cactusesSmall2 from "./assets/cactuses_small_2.png";
import cactusesSmall3 from "./assets/cactuses_small_3.png";
import cloud from "./assets/cloud.png";
import ground from "./assets/ground.png";
import duckItem from "./assets/duck.png";

import dinoIdle from "./assets/dino-idle.png";
import dinoRun from "./assets/dino-run.png";
import dinoDuck from "./assets/dino-down.png";
import enemyBird from "./assets/enemy-bird.png";
import dinoDie from "./assets/dino-hurt.png";

import jumpSound from "./assets/jump.m4a";
import hitSound from "./assets/hit.m4a";
import reachSound from "./assets/reach.m4a";
import quack from "./assets/quack.mp3";

import restart from "./assets/restart.png";
import gameOver from "./assets/game-over.png";

class DinoGame extends Phaser.Scene {
  constructor() {
    super("DinoGame");
  }

  preload() {
    this.load.audio("jump", jumpSound);
    this.load.audio("hit", hitSound);
    this.load.audio("reach", reachSound);
    this.load.audio("quack", quack);

    this.load.image("ground", ground);
    this.load.image("enemy1", cactusesBig1);
    this.load.image("enemy2", cactusesBig2);
    this.load.image("enemy3", cactusesBig3);
    this.load.image("enemy4", cactusesSmall1);
    this.load.image("enemy5", cactusesSmall2);
    this.load.image("enemy6", cactusesSmall3);
    this.load.image("cloud", cloud);
    this.load.image("duckItem", duckItem);

    this.load.image("dinoIdle", dinoIdle);
    this.load.image("dinoDie", dinoDie);
    this.load.spritesheet("dinoRun", dinoRun, {
      frameWidth: 88,
      frameHeight: 94,
    });
    this.load.spritesheet("dinoDuck", dinoDuck, {
      frameWidth: 118,
      frameHeight: 94,
    });
    this.load.spritesheet("enemyBird", enemyBird, {
      frameWidth: 92,
      frameHeight: 77,
    });

    this.load.image("restart", restart);
    this.load.image("gameOver", gameOver);
  }

  create() {
    const { height, width } = this.game.config;
    this.isGameRunning = false;
    this.canDuck = false;
    this.gameSpeed = 10;
    this.respawnTime = 0;
    this.score = 0;

    this.jumpSound = this.sound.add("jump");
    this.hitSound = this.sound.add("hit");
    this.reachSound = this.sound.add("reach");
    this.collectSound = this.sound.add("quack");

    this.startTrigger = this.physics.add
      .sprite(0, 80)
      .setOrigin(0, 1)
      .setImmovable();

    this.ground = this.add
      .tileSprite(0, height, 88, 26, "ground")
      .setOrigin(0, 1);

    this.dino = this.physics.add
      .sprite(0, height, "dinoIdle")
      .setOrigin(0, 1)
      .setDepth(1)
      .setCollideWorldBounds(true)
      .setGravityY(5000);

    this.enemies = this.physics.add.group();

    this.duckItem = this.physics.add
      .sprite(
        width * 2.5 + Math.random() * width,
        Math.random() * height,
        "duckItem"
      )
      .setOrigin(0, 1)
      .setImmovable()
      .setScale(0.1)
      .setDepth(1);

    this.environment = this.add.group();

    this.environment.addMultiple([
      this.add.image(width / 2, 170, "cloud"),
      this.add.image(width / 1.5, 120, "cloud"),
      this.add.image(width - 80, 80, "cloud"),
    ]);

    this.environment.setAlpha(0);

    this.gameOverScreen = this.add
      .container(width / 2, height / 2 - 50)
      .setAlpha(0);
    this.gameOverText = this.add.image(0, 0, "gameOver");
    this.restart = this.add.image(0, 80, "restart").setInteractive();
    this.gameOverScreen.add([this.gameOverText, this.restart]);

    this.scoreText = this.add
      .text(width, 0, "00000", {
        fill: "#535353",
        font: "900 35px Courier",
        resolution: 5,
      })
      .setOrigin(1, 0)
      .setAlpha(0);

    this.highScoreText = this.add
      .text(0, 0, "00000", {
        fill: "#535353",
        font: "900 35px Courier",
        resolution: 5,
      })
      .setOrigin(1, 0)
      .setAlpha(0);

    this.initAnims();
    this.initCollisions();
    this.scoring();
    this.initStartTrigger();
    this.gainDucking();
    this.handleInputs();
  }

  gainDucking() {
    this.physics.add.overlap(this.dino, this.duckItem, () => {
      this.canDuck = true;
      this.collectSound.play();
      this.duckItem.destroy();
    });
  }

  scoring() {
    this.time.addEvent({
      delay: 1000 / 10,
      loop: true,
      callbackScope: this,
      callback: () => {
        if (!this.isGameRunning) return;

        this.score++;
        this.gameSpeed += 0.01;

        if (this.score % 100 === 0) {
          this.reachSound.play();
        }

        const score = Array.from(String(this.score), Number);
        for (let i = 0; i < 5 - String(this.score).length; i++) {
          score.unshift(0);
        }

        this.scoreText.setText(score.join(""));
      },
    });
  }

  initStartTrigger() {
    const { width, height } = this.game.config;

    this.physics.add.overlap(
      this.startTrigger,
      this.dino,
      () => {
        const startEvent = this.time.addEvent({
          delay: 1000 / 60,
          loop: true,
          callbackScope: this,
          callback: () => {
            this.dino.setVelocityX(80);
            this.dino.play("dino-run", true);

            if (this.ground.width < width) {
              this.ground.width += 17 * 2;
            }

            if (this.ground.width >= width) {
              this.ground.width = width;
              this.isGameRunning = true;
              this.dino.setVelocityX(0);
              this.environment.setAlpha(1);
              this.scoreText.setAlpha(1);
              startEvent.remove();
            }
          },
        });
        this.startTrigger.destroy();
      },
      null,
      this
    );
  }

  initAnims() {
    this.anims.create({
      key: "dino-run",
      frames: this.anims.generateFrameNumbers("dinoRun", { start: 2, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "dino-duck",
      frames: this.anims.generateFrameNumbers("dinoDuck", { start: 1, end: 0 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "enemy-bird",
      frames: this.anims.generateFrameNumbers("enemyBird"),
      frameRate: 6,
      repeat: -1,
    });
  }

  restartGame() {
    this.dino.setVelocityY(0);
    this.dino.body.height = 92;
    this.dino.body.offset.y = 0;
    this.physics.resume();

    this.enemies.clear(true, true);

    this.isGameRunning = true;
    this.gameOverScreen.setAlpha(0);
    this.anims.resumeAll();
  }

  handleInputs() {
    this.restart.on("pointerdown", () => {
      this.restartGame();
    });

    var cursorKeys = this.input.keyboard.createCursorKeys();
    cursorKeys.up.on("down", () => {
      if (this.gameOverScreen.alpha == 1) {
        return;
      }
      this.jump();
    });

    cursorKeys.space.on("down", () => {
      if (this.gameOverScreen.alpha == 1) {
        this.restartGame();
        return;
      }
      this.jump();
    });

    cursorKeys.down.on("down", () => {
      if (this.canDuck) this.duck();
    });

    cursorKeys.down.on("up", () => {
      this.returnRunning();
    });
  }

  jump() {
    if (!this.dino.body.onFloor()) return;
    this.dino.setVelocityY(-1600);
    this.jumpSound.play();
  }

  duck() {
    if (this.dino.body.onFloor()) {
      this.dino.body.height = 62;
      this.dino.body.offset.y = 32;
      this.dino.body.width = 118;
    } else {
      this.dino.setVelocityY(800);
    }
  }

  returnRunning() {
    this.dino.body.height = 94;
    this.dino.body.offset.y = 0;
    this.dino.body.width = 88;
    this.dino.play("dino-run", true);
  }

  spawnFactory() {
    const { width, height } = this.game.config;
    const enemyNum = Math.floor(Math.random() * 7) + 1;
    const distance = 600 + Math.floor(Math.random() * 300);

    let enemy;

    if (enemyNum == 7) {
      enemy = this.enemies
        .create(width + distance, height - Math.random() * 130, "enemyBird")
        .setOrigin(0, 1);
      enemy.play("enemy-bird", true);
      enemy.body.height /= 1.5;
    } else {
      enemy = this.enemies
        .create(width + distance, height, "enemy" + enemyNum)
        .setOrigin(0, 1);
    }
  }

  initCollisions() {
    this.physics.add.collider(this.dino, this.enemies, () => {
      this.highScoreText.x = this.scoreText.x - 130;

      const highScore = this.highScoreText.text.substr(
        this.highScoreText.text.length - 5
      );
      const newScore =
        Number(this.scoreText.text) > Number(highScore)
          ? this.scoreText.text
          : highScore;

      this.highScoreText.setText("HI " + newScore);
      this.highScoreText.setAlpha(1);

      this.physics.pause();
      this.isGameRunning = false;
      this.anims.pauseAll();
      this.dino.setTexture("dinoDie");
      this.hitSound.play();
      this.respawnTime = 0;
      this.score = 0;
      this.gameOverScreen.setAlpha(1);
      this.gameSpeed = 10;
    });
  }

  update(time, delta) {
    if (!this.isGameRunning) {
      return;
    }

    this.ground.tilePositionX += this.gameSpeed;
    this.respawnTime += delta * this.gameSpeed * 0.08;
    Phaser.Actions.IncX(this.enemies.getChildren(), -this.gameSpeed);
    Phaser.Actions.IncX(this.environment.getChildren(), -0.5);
    Phaser.Actions.IncX([this.duckItem], -this.gameSpeed / 2);

    if (this.respawnTime >= 1500) {
      this.spawnFactory();
      this.respawnTime = 0;
    }

    this.enemies.getChildren().forEach((enemy) => {
      if (enemy.x < -120) {
        this.enemies.killAndHide(enemy);
      }
    });

    this.environment.getChildren().forEach((env) => {
      if (env.getBounds().right < 0) {
        env.x = this.game.config.width + 30;
      }
    });

    if (this.duckItem.getBounds().right < 0)
      this.duckItem.setX(this.game.config.width * 2 + 30);

    if (!this.dino.body.onFloor()) {
      this.dino.anims.stop;
      this.dino.setTexture("dinoIdle");
    } else {
      this.dino.play("dino-run", true);
    }
    this.dino.body.height <= 62
      ? this.dino.play("dino-duck", true)
      : this.dino.play("dino-run", true);
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 1000,
  height: 340,
  pixelArt: true,
  transparent: true,
  physics: {
    default: "arcade",
    arcade: {
      debug: true,
    },
  },
  scene: DinoGame,
};

const game = new Phaser.Game(config);
