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
let hasLanded = false;
let cursors;
let hasBumped = false;
let isGameStarted = false;
let messageToPlayer;
let isGameOver = false; // Nouvelle variable pour gérer l'état de fin de jeu

function create() {

    const background = this.add.image(0, 0, "background").setOrigin(0, 0);
    const roads = this.physics.add.staticGroup();
    const topColumns = this.physics.add.staticGroup({
        key: "column",
        repeat: 1,
        setXY: { x: 200, y: 0, stepX: 300 },
    });

    const bottomColumns = this.physics.add.staticGroup({
        key: "column",
        repeat: 1,
        setXY: { x: 350, y: 400, stepX: 300 },
    });

    const road = roads.create(400, 568, "road").setScale(2).refreshBody();

    bird = this.physics.add.sprite(0, 50, "bird").setScale(2);
    bird.setBounce(0.2);
    bird.setCollideWorldBounds(true);

    this.physics.add.overlap(bird, road, () => (hasLanded = true), null, this);
    this.physics.add.collider(bird, road);

    this.physics.add.overlap(bird, topColumns, () => hasBumped = true, null, this);
    this.physics.add.overlap(bird, bottomColumns, () => hasBumped = true, null, this);
    this.physics.add.collider(bird, topColumns);
    this.physics.add.collider(bird, bottomColumns);

    cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER); // Ajout de la touche "Entrée"

    messageToPlayer = this.add.text(0, 0, `Instructions: Press Enter to start`, { fontFamily: '"Comic Sans MS", Times, serif', fontSize: "20px", color: "white", backgroundColor: "black" });
    Phaser.Display.Align.In.BottomCenter(messageToPlayer, background, 0, 50);

}

function update() {
    if (!isGameStarted) {
        bird.setVelocityY(0);
        bird.body.allowGravity = false;
    }
    else {
        bird.body.allowGravity = true;
    }

    if (this.input.keyboard.keys[Phaser.Input.Keyboard.KeyCodes.ENTER].isDown && !isGameStarted) {
        isGameStarted = true;
        messageToPlayer.text = 'Instructions: Press the "^" button to stay upright\nAnd don\'t hit the columns or ground';
    }

    if (!hasLanded || !hasBumped) {
        bird.body.velocity.x = 50;
    }

    if (!isGameStarted) {
        bird.body.velocity.x = 0;
    }

    if ((hasLanded || hasBumped) && !isGameOver) { // Condition de game over
        messageToPlayer.text = `Oh no! You crashed!`;
        bird.body.velocity.x = 0;
        isGameOver = true; // Marquer le jeu comme terminé
        showEndScreen(this, "Game Over! \n Press Enter to restart"); // Afficher l'écran de fin
    }

    if (cursors.up.isDown && !hasLanded && !hasBumped && isGameStarted) {
        bird.setVelocityY(-160);
    }

    if (bird.x > 750 && !isGameOver) { // Condition de victoire
        bird.setVelocityY(40);
        messageToPlayer.text = `Congrats! You won!`;
        showEndScreen(this, "You Won! \n Press Enter to restart"); // Afficher l'écran de fin
        isGameOver = true; // Marquer le jeu comme terminé
    }
}

// Nouvelle fonction pour afficher l'écran de fin
function showEndScreen(scene, message) {
    bird.body.velocity.x = 0; // Arrêter le mouvement horizontal de l'oiseau
    bird.body.velocity.y = 0; // Arrêter le mouvement vertical de l'oiseau
    bird.body.allowGravity = false; // Désactiver la gravité pour l'oiseau
    


    const endScreen = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);
    const endText = scene.add.text(400, 300, message, {
        fontFamily: '"Comic Sans MS", Times, serif',
        fontSize: "40px",
        color: "white",
    }).setOrigin(0.5);

    scene.input.keyboard.once('keydown-ENTER', () => {
        scene.scene.restart(); // Redémarrer le jeu lorsque le joueur appuie sur "Entrée"
    });

    isGameStarted = false; // Réinitialiser l'état du jeu
    hasLanded = false;
    hasBumped = false;
    isGameOver = false; // Réinitialiser l'état de fin de jeu
}