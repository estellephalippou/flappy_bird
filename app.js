let config = {
    renderer: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 300 },
            debug: false,
        },
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
    },
};

let game = new Phaser.Game(config);

function preload() {
    this.load.image("background", "assets/background.png");
    this.load.image("road", "assets/road.png");
    this.load.image("column", "assets/column.png");
    this.load.spritesheet("bird", "assets/bird.png", {
        frameWidth: 64,
        frameHeight: 96,
    });
}

var bird;
let background;
let bgScrollSpeed = 0.2;
let pipeScrollSpeed = 0.4;
let hasLanded = false;
let cursors;
let hasBumped = false;
let isGameStarted = false;
let messageToPlayer;
let isGameOver = false;
let enterKey;
let isEndScreenVisible = false;
let pipes;
let pipeSpawnTimer;
const pipeGap = 170;
const pipeSpawnDelayMs = 2000;
const victoryX = 750;
const stopSpawningBeforeVictoryPx = 180;

function create() {
    hasLanded = false;
    hasBumped = false;
    isGameStarted = false;
    isGameOver = false;
    isEndScreenVisible = false;
    pipeSpawnTimer = null;

    background = this.add.tileSprite(0, 0, config.width, config.height, "background")
        .setOrigin(0, 0)
        .setDepth(0);
   
    cursors = this.input.keyboard.createCursorKeys();
    enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER); // Ajout de la touche "Entrée"
    messageToPlayer = this.add.text(0, 0, `Instructions: Press Enter to start`, {
        fontFamily: '"Comic Sans MS", Times, serif',
        fontSize: "20px",
        color: "white",
        backgroundColor: "black",
    })
        .setOrigin(0.5, 1)
        .setPosition(config.width / 2, config.height - 20)
        .setDepth(1000);

    const roads = this.physics.add.staticGroup();
    
    pipes = this.physics.add.group({
        allowGravity: false,
        immovable: true,
    });
    
    const road = roads.create(400, 568, "road").setScale(2).refreshBody();
    road.setDepth(20);

    bird = this.physics.add.sprite(0, 50, "bird").setScale(2);
    bird.setBounce(0.2);
    bird.setCollideWorldBounds(true);

    this.physics.add.overlap(bird, road, () => (hasLanded = true), null, this);
    this.physics.add.collider(bird, road);

    this.physics.add.overlap(bird, pipes, () => (hasBumped = true), null, this);
    this.physics.add.collider(bird, pipes);

}

function update() {

    if (!isGameStarted) {
        bird.setVelocityY(0);
        bird.body.allowGravity = false;
        if (pipes) {
            pipes.setVelocityX(0);
        }
    }
    else {
        bird.body.allowGravity = true;
        background.tilePositionX += bgScrollSpeed;
        if (pipes) {
            pipes.setVelocityX(-pipeScrollSpeed * 300);
        }
    }

    if (Phaser.Input.Keyboard.JustDown(enterKey) && !isGameStarted && !isGameOver && !isEndScreenVisible) {
        isGameStarted = true;
        messageToPlayer.text = 'Instructions: Press the "space" button to stay upright\nAnd don\'t hit the columns or ground';

        if (!pipeSpawnTimer) {
            spawnPipePair(this);
            pipeSpawnTimer = this.time.addEvent({
                delay: pipeSpawnDelayMs,
                loop: true,
                callback: () => spawnPipePair(this),
            });
        }
    }

    if (pipes) {
        pipes.getChildren().forEach((pipe) => {
            if (pipe.x < -100) {
                pipe.destroy();
            }
        });
    }

    if (!hasLanded && !hasBumped) {
        bird.body.velocity.x = 50;
    }

    if (!isGameStarted) {
        bird.body.velocity.x = 0;
    }

    if ((hasLanded || hasBumped) && !isGameOver) { // Condition de game over
        messageToPlayer.text = `Oh no! You crashed!`;
        isGameOver = true; // Marquer le jeu comme terminé
        isGameStarted = false; // Arrêter le jeu
        if (pipeSpawnTimer) {
            pipeSpawnTimer.remove(false);
            pipeSpawnTimer = null;
        }
        showEndScreen(this, "Game Over! \n Press Enter to restart"); // Afficher l'écran de fin
    }

    if (cursors.space.isDown && !hasLanded && !hasBumped && isGameStarted) {
        bird.setVelocityY(-160);
    }

    if (isGameStarted && pipeSpawnTimer && bird && bird.x >= (victoryX - stopSpawningBeforeVictoryPx)) {
        pipeSpawnTimer.remove(false);
        pipeSpawnTimer = null;
    }

    if (bird.x > victoryX && !isGameOver) { // Condition de victoire
        bird.setVelocityY(40);
        messageToPlayer.text = `Congrats! You won!`;
        isGameOver = true; 
        isGameStarted = false;
        if (pipeSpawnTimer) {
            pipeSpawnTimer.remove(false);
            pipeSpawnTimer = null;
        }
        showEndScreen(this, "You Won! \n Press Enter to restart"); // Afficher l'écran de fin
    }
}

function spawnPipePair(scene) {
    if (!pipes) {
        return;
    }

    if (bird && bird.x >= (victoryX - stopSpawningBeforeVictoryPx)) {
        return;
    }

    const spawnX = config.width + 60;

    const minCenterY = 140;
    const maxCenterY = 420;
    const centerY = Phaser.Math.Between(minCenterY, maxCenterY);

    const topPipe = pipes.create(spawnX, 0, "column");
    const bottomPipe = pipes.create(spawnX, 0, "column");

    topPipe.setDepth(10);
    bottomPipe.setDepth(10);

    topPipe.setFlipY(true);

    const topY = centerY - pipeGap / 2 - topPipe.displayHeight / 2;
    const bottomY = centerY + pipeGap / 2 + bottomPipe.displayHeight / 2;

    topPipe.setPosition(spawnX, topY);
    bottomPipe.setPosition(spawnX, bottomY);

    topPipe.body.allowGravity = false;
    bottomPipe.body.allowGravity = false;

}

// Nouvelle fonction pour afficher l'écran de fin
function showEndScreen(scene, message) {
    if (isEndScreenVisible) {
        return;
    }
    isEndScreenVisible = true;

    bird.body.velocity.x = 0; // Arrêter le mouvement horizontal de l'oiseau
    bird.body.velocity.y = 0; // Arrêter le mouvement vertical de l'oiseau
    bird.body.allowGravity = false; // Désactiver la gravité pour l'oiseau
    


    const endScreen = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.8).setDepth(2000);
    const endText = scene.add.text(400, 300, message, {
        fontFamily: '"Comic Sans MS", Times, serif',
        fontSize: "40px",
        color: "white",
    }).setOrigin(0.5).setDepth(2001);

    scene.input.keyboard.once('keydown-ENTER', () => {
        scene.scene.restart(); // Redémarrer le jeu lorsque le joueur appuie sur "Entrée"
    });
}