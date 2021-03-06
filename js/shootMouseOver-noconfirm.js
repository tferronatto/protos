var TILE = 64;
var HTILE = TILE/2;
var ROWS = 8;
var COLS = 12;
var bg, grid, textAttack, textHit;
var player, enemy, cursors, bullets, bullet, explosions, rocks,line, tint;
var bulletTime = 0;
var moveTarget = {x: 0, y: 0};
var game = new Phaser.Game(COLS * TILE, ROWS * TILE, Phaser.AUTO, '', {preload: preload, create: create, update: update});
    
function preload() {
    game.load.spritesheet('lizardAppear','assets/deimaginator_appear.png', 251, 186, 25);
    game.load.spritesheet('lizardIdle','assets/deimaginator_idle.png', 251, 186, 135);
    game.load.spritesheet('robotAppear','assets/robot_attract.png', 81, 88, 57);
    game.load.spritesheet('robotIdle','assets/robot_idle.png', 81, 88, 24);
    game.load.spritesheet('catAppear', 'assets/cat_appear.png', 136, 115, 47);
    game.load.spritesheet('catJump', 'assets/cat_jump.png', 136, 115, 12);
    game.load.spritesheet('catFly', 'assets/cat_fly.png', 136, 115, 20);
    game.load.spritesheet('kaboom', 'assets/explode.png', 128, 128);
    game.load.image('bullet', 'assets/bullet.png');
    game.load.image('rock', 'assets/rock64.png');
}
//-------------------
function create() {
    // init physics
    game.physics.startSystem(Phaser.Physics.ARCADE);
    
    //init bg
    bg = game.add.graphics(0, 0);
    bg.beginFill(0xf3f9f0);
    bg.drawRect(0, 0, game.world.width, game.world.height);
    bg.endFill();
    grid = game.add.graphics(0, 0);
    grid.lineStyle(1, 0x999999);
    for (var i=0; i < COLS; i++){
        grid.moveTo(i*TILE, 0);
        grid.lineTo(i*TILE, game.world.height);
    }
    for (var i=0; i < ROWS; i++){
        grid.moveTo(0, i*TILE);
        grid.lineTo(game.world.width, i*TILE);
    }
        
    createEnemy();
        
    //create cover
    rocks = game.add.group();
    rocks.enableBody = true;
    game.physics.enable(rocks, Phaser.Physics.ARCADE);
    for (var i=0; i < 3; i++){
        var rock = rocks.create((rndInt(0, COLS-1) * TILE) + HTILE, (rndInt(0, ROWS-1) * TILE) + HTILE, 'rock');
        rock.anchor.x = rock.anchor.y = 0.5;
        if (rock.x == enemy.x) rock.x += TILE;
        if (rock.y == enemy.y) rock.y += TILE;
    }
    
    //init player
    player = game.add.sprite((rndInt(0, COLS-1) * TILE) + HTILE, (rndInt(0, ROWS-1) * TILE) + HTILE, 'catAppear');
    game.physics.arcade.enable(player);
    player.anchor.x = 0.65;
    player.anchor.y = 0.50;
    player.animations.add('appear');
    player.events.onAnimationComplete.add(animComplete1, this);
    player.animations.play('appear', 20, false);
    player.canMove = false;
    
    //init bullets
    bullets = game.add.group();
    bullets.enableBody = true;
    game.physics.enable(bullets, Phaser.Physics.ARCADE);
    bullets.createMultiple(30, 'bullet');
    bullets.setAll('anchor.x', 0.5);
    bullets.setAll('anchor.y', 0.5);
    bullets.setAll('outOfBoundsKill', true);
    bullets.setAll('checkWorldBounds', true);
    
    //  An explosion pool
    explosions = game.add.group();
    explosions.createMultiple(30, 'kaboom');
    explosions.forEach(function(boom){
        boom.anchor.x = boom.anchor.y = 0.5;
        boom.animations.add('kaboom');
    }, this);
    
    textAttack = game.add.text(0, 0, 'ATTACK!', {font: "bold 16px sans-serif", fill: "#f00"});
    textAttack.anchor.x = 0.5;
    textAttack.x = enemy.x;
    textAttack.y = enemy.y - 80;
    textAttack.visible = false;
    
    textHit = game.add.text(0, 0, '$%#&!', {font: "bold 16px sans-serif", fill: "#000"});
    textHit.anchor.x = 0.5;
    textHit.x = enemy.x;
    textHit.y = enemy.y - 80;
    textHit.visible = false;
    
    line = new Phaser.Line(player.x, player.y, enemy.x, enemy.y);
    
    //init inputs
    cursors = game.input.keyboard.createCursorKeys();
    game.input.onDown.add(handleClick, this);
}
//-------------------

function update() {
    if (player.canMove){
        player.canMove = false;
        movePlayer(moveTarget.x, moveTarget.y);
    }
        
    // player always faces enemy
    if (player.x > enemy.x) {
        player.scale.x = -1;
        enemy.scale.x = -1;
    }
    else {
        player.scale.x = 1;
        enemy.scale.x = 1;
    }
        
    line.fromSprite(player, enemy, false);
    if (enemy.underAim) game.debug.geom(line);
    else game.debug.reset();
        
    // Run update
    if (getWallIntersection(line, rocks)){
        textAttack.text = "BLOCKED";
        textAttack.setStyle({fill: "blue"});
        tint = 0x0000ff;
    }
    else {
        textAttack.text = "ATTACK";
        textAttack.setStyle({fill: "red"});
        tint = 0xff0000;
    }
        
    game.physics.arcade.overlap(rocks, bullets, collisionHandler, null, this);
    game.physics.arcade.overlap(bullets, enemy, collisionHandler2, null, this);
}
//-------------------    

function collisionHandler(enemy, bullet){
    bullet.kill();
    
    //  And create an explosion :)
    var explosion = explosions.getFirstExists(false);
    explosion.reset(enemy.x, enemy.y);
    explosion.play('kaboom', 30, false, true);
}

function collisionHandler2(enemy, bullet){
    bullet.kill();
    
    //  And create an explosion :)
    var explosion = explosions.getFirstExists(false);
    explosion.reset(enemy.x, enemy.y);
    explosion.play('kaboom', 30, false, true);
    
    enemy.animations.stop();
    enemy.loadTexture('robotAppear');
    enemy.events.onAnimationComplete.add(appearComplete, this);
    enemy.animations.play('appear', 20);
    textHit.visible = true;
}   

    
//-------------------

function appearComplete(){
    enemy.events.onAnimationComplete.remove(appearComplete, this);
    enemy.loadTexture('robotIdle');
    enemy.animations.add('idle');
    enemy.animations.play('idle', 20, true);
    textHit.visible = false;
}
    
function animComplete1(){
    player.events.onAnimationComplete.remove(animComplete1, this);
    player.loadTexture('catJump');
    player.animations.add('jump');
    player.events.onAnimationComplete.add(animComplete2, this);
    player.animations.play('jump', 20, false);
}
    
function animComplete2(){
    player.events.onAnimationComplete.remove(animComplete2, this);
    player.loadTexture('catFly');
    player.anchor.y = 0.65;
    player.animations.add('fly');
    player.animations.play('fly', 20, true);
}
//-----------------

function handleClick(pointer){
    if (!player.canMove && !enemy.underAim){
        player.canMove = true;
        moveTarget.x = Math.floor(pointer.x/TILE);
        moveTarget.y = Math.floor(pointer.y/TILE);
    }
    
    else if (enemy.underAim){
        fireBullet();
    }
}
    
function movePlayer(posx, posy){
    var tween = game.add.tween(player);
    var moveTime = game.physics.arcade.distanceToXY(player,(posx * TILE) + HTILE, (posy * TILE) + HTILE);
    tween.to({x: (posx * TILE) + HTILE, y: (posy * TILE) + HTILE}, moveTime * 2);
    tween.start();
}
//-----------------

function rndInt(min, max){
    return Math.round(min + (Math.random() * (max-min)));
}
//----------------

function enemyHighlight(pointer){
    enemy.tint = tint;
    enemy.underAim = true;
    textAttack.visible = true;
}

function enemyTintReset(pointer){
    enemy.tint = 0xffffff;
    enemy.underAim = false;
    textAttack.visible = false;
}
    
function fireBullet(){
    if (game.time.now > bulletTime){
        
        // get bullets from the pool
        bullet = bullets.getFirstExists(false);
            
        if (bullet){
            // and fire it
            bullet.reset(player.x, player.y);
            bullet.rotation = game.physics.arcade.angleBetween(player,enemy) - (Math.PI / 2);
            game.physics.arcade.moveToObject(bullet, enemy, 500);
            bulletTime = game.time.now + 300;
        }
    }
}
//-----------------------

function createEnemy(){
    //init enemy
    enemy = game.add.sprite((rndInt(0, COLS-1) * TILE) + HTILE,(rndInt(1, ROWS-1) * TILE) + HTILE, 'robotAppear');
    enemy.enableBody = true;
    game.physics.enable(enemy, Phaser.Physics.ARCADE);
    enemy.anchor.x = 0.5;
    enemy.anchor.y = 0.7;
    enemy.inputEnabled = true;
    enemy.underAim = false;
    enemy.animations.add('appear');
    enemy.events.onAnimationComplete.add(appearComplete, this);
    enemy.events.onInputOver.add(enemyHighlight, this);
    enemy.events.onInputOut.add(enemyTintReset, this);
    enemy.animations.play('appear', 20);
}
//---------------------

function getWallIntersection(line, group){
    var closestIntersection = null;
    group.forEach(function(block){
        var posX = block.x - HTILE;
        var posY = block.y - HTILE;
        var blockLine = [
            new Phaser.Line(posX, posY, posX+TILE, posY),
            new Phaser.Line(posX+TILE, posY, posX+TILE, posY + TILE),
            new Phaser.Line(posX+TILE, posY+TILE, posX, posY + TILE),
            new Phaser.Line(posX, posY+TILE, posX, posY)
        ];
        
        for (var i=0; i < blockLine.length; i++){
            var intersect = Phaser.Line.intersects(line, blockLine[i]);
            if (intersect) closestIntersection = intersect;
        }
    },this);
        
    return closestIntersection;
}