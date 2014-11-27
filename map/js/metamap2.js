(function() { // private module pattern

//================================
// CONSTANTS
//================================

var FPS		= 30,
	WIDTH	= 640,
	HEIGHT	= 480,
	IMAGES	= ['bg','player','cities','nofuel','battle','won','lost'],
	PLAYER	= { DEBUG: false,
		W:	{x:  49, y:  5, w: 68, h: 38, frames: 1, fps: 30},
		NW:	{x: 193, y:  5, w: 54, h: 40, frames: 1, fps: 30},
		N:	{x: 465, y:  5, w: 34, h: 41, frames: 1, fps: 30},
		NE:	{x: 401, y:  5, w: 54, h: 40, frames: 1, fps: 30},
		E:	{x: 257, y:  5, w: 68, h: 38, frames: 1, fps: 30},
		SE:	{x: 335, y:  5, w: 56, h: 42, frames: 1, fps: 30},
		S:	{x:   5, y:  5, w: 34, h: 42, frames: 1, fps: 30},
		SW:	{x:  127, y: 5, w: 56, h: 42, frames: 1, fps: 30},
		SPEED: 0.1
	},
	MAP	= {
		BEACON: {x:  1, y:  1, w: 52, h: 30, frames: 1, fps: 30},
		CAVE:	{x:  1, y: 33, w: 48, h: 38, frames: 1, fps: 30},
		CITY:	{x: 55, y:  1, w: 48, h: 69, frames: 1, fps: 30}
	},
	DIRECTION = {EAST: 0, SOUTHEAST: 1, SOUTH: 2, SOUTHWEST: 3,
				 WEST: 4, NORTHWEST: 5,	NORTH: 6, NORTHEAST: 7
	},
	BEACONS = [
		{name: "Xanadu", type: "city", revealed: false, active: true},
		{name: "Sbornia City", type: "city", revealed: true},
		{name: "Devil's Mouth", type: "cave", revealed: false, active: false},
		{name: "Hill Valley", type: "city", revealed: true},
		{name: "Bar-A-Kas Hell", type: "cave", revealed: false, active: false},
		{name: "Rat Pit", type: "cave", revealed: false, active: false}
	],
	FONT = {
		STYLE: "16px monospace",
		COLOR: "#4444FF"
	},
	WEAPON_FACTOR = 5,
	UNIT_FACTOR = 15;
	MAX_UNITS = 6;
	
//================================
// VARIABLES
//================================
var	player,
	cities,
	renderer,
	mouse = {x: 0, y:0};
	upgradeCost = 5;
	victoryChance = 20;

//================================
// GAME - SETUP/UPDATE/RENDER
//================================
function run() {
	Game.Load.images(IMAGES, function(images) {
		setup(images);
		Game.run({
			fps:	FPS,
			update:	update,
			render:	render
		});
		console.log('roda birosca');
		Dom.on("canvas", 	 "click",    function(ev){handleClick(ev);},false);
		Dom.on("canvas", 	 "mousemove",function(ev){getMousePos(ev);},false);
		Dom.on("debug",  	 "click", 	 function(ev){toggleDebug(ev);},false);
		Dom.on("requestAid", "click", 	 function(){requestAid();},false);
		Dom.on("refuel", 	 "click", 	 function(){refuel();},false);
		Dom.on("mission", 	 "click", 	 function(){revealBeacon();},false);
		Dom.on("upgrade", 	 "click", 	 function(){upgrade();},false);
		Dom.on("hire", 	 "click", 	 function(){hire();},false);
		Dom.on("battle", 	 "click", 	 function(){battle();},false);
	});
}

function setup(images) {
	player	 	= new Player();
	renderer	= new Renderer(images);
	cities		= new Cities(BEACONS);
}

function update(dt) {
	player.update(dt);
	cities.update(dt);
}

function render(dt) {
	renderer.render(dt);
}

function handleClick(ev) {
	player.target.x = ev.offsetX;
	player.target.y = ev.offsetY;
	player.changeAnimation = true;
	if (!player.move) player.move = true;
	if (player.inBattle) player.inBattle = false;
	console.log("click x:" + ev.offsetX + " y:" + ev.offsetY);
}

function getMousePos(ev) {
	mouse.x = ev.offsetX;
	mouse.y = ev.offsetY;
}

function toggleDebug(ev){
	PLAYER.DEBUG = ~PLAYER.DEBUG;
	console.log("DEBUG MODE: " + PLAYER.DEBUG);
}

function requestAid(){
	player.fuel += Game.Math.randomInt(25,75);
	if (player.fuel > 100) player.fuel = 100;
	Dom.hide("requestAid");
}

function refuel(){
	if (player.fuel < 100 && player.money > 0){
		player.fuel = 100;
		player.money -= 10;
		if (player.money < 0) player.money = 0;
	}
}

function revealBeacon(){
	var i = Game.Math.randomChoice([2,4,5]);
	if (!cities.all[i].active){
		cities.all[i].active = true;
		//cities.all[i].x = Game.Math.randomInt(50, WIDTH-50);
		//cities.all[i].x = Game.Math.randomInt(70, HEIGHT-10);
	}
}

function upgrade(){
	if (player.money >= player.upgradeCost){
		player.money -= player.upgradeCost;
		player.upgradeCost = Math.ceil(player.upgradeCost * 1.5);
		player.upgrades++;
		victoryChance += WEAPON_FACTOR;
		if (victoryChance > 100) victoryChance = 100;
	}
}

function hire(){
	if (player.money > 200){
		player.soldiers++;
		if (player.soldiers > MAX_UNITS) {
			player.soldiers = MAX_UNITS;
			Dom.get("hire").innerHTML = "MAX UNITS REACHED";
		} else {
			player.money -= 200;
			victoryChance += UNIT_FACTOR;
			if (victoryChance > 100) victoryChance = 100;
		}
	}
}

function battle(){
	player.inBattle = true;
	player.victory = Game.Math.random(0,100);
	if (player.victory <= victoryChance)
		player.money += Game.Math.randomInt(20,70);
	else {
		player.money -= Game.Math.randomInt(5,15);
		if (player.money < 0) player.money = 0;
	}
	cities.all[player.inBeaconId].active = false;
	cities.all[player.inBeaconId].revealed = false;
	Dom.hide("cavemenu");
}

//=================================
// GAME CLASSES
//=================================
//=================================
// PLAYER
//=================================
var Player = Class.create({

	initialize:	function() {
		this.x	= WIDTH / 2;
		this.y	= HEIGHT / 2;
		this.target = {
			x: this.x,
			y: this.y
		};
		this.dx = 0;
		this.dy = 0;
		this.move = false;
		this.animation = PLAYER.W;
		this.changeAnimation = false;
		this.collisionBox = this.getCollisionBox();
		this.fuel = 100;
		this.money = 50;
		this.inBeacon = "";
		this.inBeaconType = "";
		this.inBeaconId = null;
		this.inBattle = false;
		this.soldiers = 1;
		this.upgrades = 0;
		this.upgradeCost = 5;
		
	},
	//-----------------------------
	
	update: function(dt) {
		var a, b;
		if (this.move && this.fuel){
			var targX = this.target.x;
			var targY = this.target.y;
			this.dx = targX - this.x;
			this.dy = targY - this.y;
			this.x += Math.ceil(this.dx * PLAYER.SPEED);
			this.y += Math.ceil(this.dy * PLAYER.SPEED);
			if (this.fuel > 0) {
				a = Math.abs(Math.round(this.dx / 100));
				b = Math.abs(Math.round(this.dy / 100));
				if (!a) this.fuel -= b;
				else if (!b) this.fuel -=a;
				else this.fuel -= Math.sqrt(Math.pow(a,2),Math.pow(b,2));
			}
			else { 
				this.fuel = 0;
				this.stopMoving();
			}
			
			if (Math.abs(this.dx) <= 0 && Math.abs(this.dy) <= 0) 
					this.stopMoving();
			
			this.collisionBox = this.getCollisionBox();
			if(this.changeAnimation){
				this.updateAnimation();
				this.changeAnimation = false;
			}
		}
	},
	//-----------------------------
	
	updateAnimation: function() {
		var angle = Math.round(Game.Math.getAngle(player, player.target));
		var direction = Math.round(angle/360 * 8);
		if (direction == DIRECTION.EAST) 		this.animation = PLAYER.E;
		if (direction == DIRECTION.SOUTHEAST)	this.animation = PLAYER.SE;
		if (direction == DIRECTION.SOUTH) 		this.animation = PLAYER.S;
		if (direction == DIRECTION.SOUTHWEST) 	this.animation = PLAYER.SW;
		if (direction == DIRECTION.WEST) 		this.animation = PLAYER.W;
		if (direction == DIRECTION.NORTHWEST) 	this.animation = PLAYER.NW;
		if (direction == DIRECTION.NORTH) 		this.animation = PLAYER.N;
		if (direction == DIRECTION.NORTHEAST) 	this.animation = PLAYER.NE;
	},
	//-----------------------------
	getCollisionBox: function(){
		return {x: this.x - (this.animation.w/2),
				y: this.y - (this.animation.h/2),
				w: this.animation.w, 
				h: this.animation.h};
	},
	//-----------------------------
	stopMoving: function(){
		this.move = false;
		this.target.x = this.x;
		this.target.y = this.y;
		console.log("player stopped at x:" + this.x + " y:" + this.y);
	}
});
//=================================
// CITIES
//=================================
var Cities = Class.create({
	initialize:	function(beacons) {
		this.all = this.createBeacons(beacons);
	},
	//-----------------------------
	
	update:	function(dt) {
		var all = this.all;
		player.inBeacon = "???";
		player.inBeaconType = "???";
		player.inBeaconId = null;
		
		for (var i=0; i<all.length; i++) {
			if (all[i].active){
				//COLLISION WITH PLAYER
				if (all[i].checkCollision(player.getCollisionBox())){
					if (!all[i].revealed) all[i].revealed = true;
					//player.stopMoving();
					all[i].renderName = true;
					all[i].renderMenu = true;
					player.inBeacon = all[i].name;
					player.inBeaconType = all[i].type;
					player.inBeaconId = i;
					
				}
				else {
					all[i].renderName = false;
					all[i].renderMenu = false;
				}
				
				//MOUSEOVER
				if (all[i].checkCollisionPoint(mouse))
					all[i].renderName = true;
			}
		}
	},
	//-----------------------------
	createBeacons:	function(beacons){
		var all = [];
		for (var i=0; i < beacons.length; i++)
			all.push(new Beacon(beacons[i]));
		return all;
	},
	//-----------------------------
	addBeacons:	function(beacons) {
		for (var i=0; i< beacons.length; i++)
			this.all.push(new Beacon(beacons[i]));
	}
});
//=================================
// MAP BEACON
//=================================
var Beacon = Class.create({
	initialize:	function(beacon) {
		this.name = beacon.name;
		this.type = beacon.type;
		this.active = (beacon.active == undefined) ? true : beacon.active;
		this.revealed = beacon.revealed || false;
		this.revealedRate = this.revealed ? 100 : 0;
		this.animation = this.getAnimation(this.type);
		this.x = beacon.x || Game.Math.random(50, WIDTH - MAP.BEACON.w);
		this.y = beacon.y || Game.Math.random(70, HEIGHT - MAP.BEACON.h);
		this.collisionBox = {
			x: this.x - (MAP.BEACON.w/2),
			y: this.y - (MAP.BEACON.h/2),
			w: MAP.BEACON.w,
			h: MAP.BEACON.h
		};
		this.menu = beacon.menu;
		this.renderName = false;
		this.renderMenu = false;
		
	},
	//-----------------------------
	
	getAnimation:	function(type){
		if (type == "city") 	return MAP.CITY;
		else if (type == "cave") 	return MAP.CAVE;
		else return null;
	},
	//-----------------------------
	checkCollision:	function(obj){
		return !(
			(this.collisionBox.y + this.collisionBox.h < obj.y)	||
			(this.collisionBox.y > obj.y + obj.h)				||
			(this.collisionBox.x + this.collisionBox.w < obj.x)	||
			(this.collisionBox.x > obj.x + obj.w));
	},
	//-----------------------------
	checkCollisionPoint: function(obj){
		return !((obj.x < this.collisionBox.x)						||
				 (obj.x > this.collisionBox.x + this.collisionBox.w) ||
				 (obj.y < this.collisionBox.y)						||
				 (obj.y > this.collisionBox.y + this.collisionBox.h)); 
	}
});

//=================================
// RENDERER
//=================================
var Renderer = Class.create({

	initialize:	function(images) {
		this.images		= images;
		this.canvas		= Game.Canvas.init(Dom.get('canvas'),WIDTH, HEIGHT);
		this.ctx		= this.canvas.getContext('2d');
		this.bg			= this.createBG();
		this.menuCreated = false;
		this.hideHUD("requestAid");
		this.hideHUD("citymenu");
		this.hideHUD("cavemenu");
	},
	//------------------------------
	
	render:	function(dt) {
		this.ctx.clearRect(0, 0, WIDTH, HEIGHT);
		this.renderBG(this.ctx);
		this.renderCities(this.ctx);
		this.renderPlayer(this.ctx);
		this.renderHUD();
	},
	//------------------------------
	
	renderBG: function(ctx) {
		ctx.drawImage(this.bg.image, 0, 0, this.bg.w, this.bg.h);
	},
	//------------------------------
	
	renderPlayer: function(ctx) {
		var regX = player.x - (player.animation.w /2);
		var regY = player.y - (player.animation.h /2);
		ctx.drawImage(this.images.player, player.animation.x, player.animation.y, player.animation.w, player.animation.h, regX, regY, player.animation.w, player.animation.h);
		
		if (!player.fuel){
			ctx.drawImage(this.images.nofuel, 0, 0, 48, 30, regX, regY - 32, 48, 30);
			this.showHUD("requestAid");
		}
		
		if (player.inBeaconType == "city") this.showHUD("citymenu");
		else if (player.inBeaconType == "cave") this.showHUD("cavemenu");
		else {this.hideHUD("citymenu"); this.hideHUD("cavemenu");}
		
		if (player.inBattle){
			if (player.victory <= victoryChance) ctx.drawImage(this.images.won, 0, 0, 48, 30, regX, regY - 32, 48, 30);
			else ctx.drawImage(this.images.lost, 0, 0, 48, 30, regX, regY - 32, 48, 30);
		}

		if (PLAYER.DEBUG) {
			ctx.globalAlpha = 0.3;
			ctx.fillStyle = "#0000AA";
			ctx.fillRect(player.collisionBox.x, player.collisionBox.y, 
						 player.collisionBox.w, player.collisionBox.h);
			ctx.globalAlpha = 1;
		}
	},
	//------------------------------
	
	renderCities: function(ctx) {
		var all = cities.all;
		for (var i=0; i < all.length; i++)
			if (all[i].active || PLAYER.DEBUG) {
				this.renderBeacon(ctx, all[i]);
				if (all[i].renderName) this.renderCityName(ctx, all[i]);
				if (all[i].revealed) this.renderCity(ctx, all[i]);
				//if (all[i].renderMenu) this.renderMenu(ctx, all[i]);
			}
	},
	//------------------------------
	renderBeacon: function(ctx, beacon) {
		var regX = beacon.x - (MAP.BEACON.w / 2);
		var regY = beacon.y - (MAP.BEACON.h / 2);
		ctx.drawImage(	this.images.cities, 
						MAP.BEACON.x, MAP.BEACON.y, MAP.BEACON.w, MAP.BEACON.h,
						regX, regY, MAP.BEACON.w, MAP.BEACON.h);

		if (PLAYER.DEBUG) {
			ctx.globalAlpha = 0.3;
			ctx.fillStyle = "#00AA00";
			ctx.fillRect(beacon.collisionBox.x, beacon.collisionBox.y, 
						 beacon.collisionBox.w, beacon.collisionBox.h);
			ctx.globalAlpha = 1;
		}		
	},
	//------------------------------
	
	renderCity:	function(ctx, city) {
		var scale = 1;
		if (city.revealedRate < 100){
			scale = city.revealedRate/100;
			city.revealedRate += 5;
		}
		var regX = city.x - (city.animation.w/2);
		var regY = city.y - ((city.animation.h*scale) - (MAP.BEACON.h/2));
		ctx.drawImage( this.images.cities,
					   city.animation.x, city.animation.y, city.animation.w, city.animation.h,
					   regX, regY, city.animation.w, (city.animation.h * scale));
	},
	
	renderCityName: function(ctx, city){
		var txtLength = ctx.measureText(city.name).width;
		var offset = 5;
		var lineX = city.animation.w / 2;
		var lineY = city.animation.h / 2;
		if (city.x < 70) {lineX = -lineX; txtLength = -txtLength};
		if (city.y < 70) {lineY = -lineY; offset = -15;}

		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(city.x, city.y);
		ctx.lineTo(city.x - lineX, city.y - lineY);
		ctx.lineTo(city.x - lineX - txtLength, city.y - lineY);
		ctx.strokeStyle = FONT.COLOR;
		ctx.stroke();
		
		ctx.font = FONT.STYLE;
		ctx.fillStyle = FONT.COLOR;
		ctx.fillText(city.name, city.x - lineX - txtLength, city.y - lineY - offset);
	},
	//------------------------------
	showHUD: function(id){
		var elem = Dom.get(id);
		if (elem.style.display == "none") 
			Dom.show(id);
	},
	
	hideHUD: function(id){
		if (Dom.get(id).style.display != "none") 
			Dom.hide(id);
	},
	
	renderHUD: function(){
		Dom.get("playerFuel").innerHTML = "Fuel: " + player.fuel;
		Dom.get("playerScraps").innerHTML = "Scraps: " + player.money;
		Dom.get("currentCity").innerHTML = "Current City: " + player.inBeacon;
		Dom.get("soldiers").innerHTML = "Soldiers: " + player.soldiers;
		Dom.get("upgrades").innerHTML = "Upgrades: " + player.upgrades;
		Dom.get("nextUpgrade").innerHTML = "Next Upgrade Cost: " + player.upgradeCost + " scraps";
		Dom.get("victoryChance").innerHTML = "Victory Chance: " + victoryChance + "%";
	},
	//------------------------------
	createBG:	function() {
		var w		= WIDTH;
		var h		= HEIGHT;
		var image	= this.images.bg;
		return {w: w, h: h, image: image};
	},
	//------------------------------
});
//==================================
// RUUUUUUUUUUN!
//==================================

run();	//game loop
	
})();