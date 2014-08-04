var TAU = 2*Math.PI;
function DrawerInterpreter(r1, r2, steps, pos, context, armcontext, w, h, errrate, penwidth){
	errrate = errrate || 0;

	this.r1 = r1;
	this.r2 = r2;
	this.steps = steps;
	this.pos = pos;
	this.context = context;
	this.armcontext = armcontext;
	this.armcontextdata = {width:w,height:h};

	this.a = 0;
	this.b = Math.floor(steps/4);
	this.pen = 0;

	this.errrate = errrate;
	this.reala = this.a;
	this.realb = this.b;
	this.lastdb = 0;
	this.lastda = 0;

	this.penwidth = penwidth;

	this.drawqueue = [];
}
DrawerInterpreter.prototype.reset = function(){
	this.a = 0;
	this.b = Math.floor(this.steps/4);
	this.reala = 0;
	this.realb = this.b;
	this.pen = 0;
	this.lastdb = 0;
	this.lastda = 0;
	this.drawqueue = [];
}
//
DrawerInterpreter.prototype._command=function(cmd){
	switch(cmd.action){
			case "pen":
				switch(cmd.pos){
					case "up":
						this.pen=0;
						break;
					case "down":
						this.pen=1;
						break;
					case "retract":
						this.pen=-1;
						break;
				}
				break;
			
			case "move":
			 	if(this.a-cmd.a>this.steps/2) this.a-=this.steps;
			 	if(this.a-cmd.a<-this.steps/2) this.a+=this.steps;
			 	if(this.b-cmd.b>this.steps/2) this.b-=this.steps;
			 	if(this.b-cmd.b<-this.steps/2) this.b+=this.steps;
				while(this.a!=cmd.a || this.b!=cmd.b){
					var da=0,db=0;
					if     (this.a<cmd.a) da=1;
					else if(this.a>cmd.a) da=-1;
					if     (this.b<cmd.b) db=1;
					else if(this.b>cmd.b) db=-1;
					this._delta(da,db);
				}
				break;
			
			case "advance":
				for (var j = 0; j < cmd.path.length; j++) {
					var d=cmd.path[j];
					this._delta(d[0],d[1]);
				};
				break;
			
			case "sweep":
				for (var j = 0; j < cmd.len; j++) {
					if(cmd.dir=="a"){
						this._delta(cmd.sign,0);
					}else{
						this._delta(0,cmd.sign);
					}
				};
				break;
		}
}
DrawerInterpreter.prototype.do=function(string){
	this.enqueue(string);
	this.runQueue(-1);
}
DrawerInterpreter.prototype.enqueue=function(string){
	if(string=="")return;
	var instructions = adlparser.parse(string);
	for (var i = 0; i < instructions.length; i++) {
		var cmd = instructions[i];
		this._command(cmd);
	};
}
DrawerInterpreter.prototype.clearQueue=function(){
	this.drawqueue=[];
}
DrawerInterpreter.prototype.runQueue=function(iters){
	if(iters==0) return true;
	this.armcontext.clearRect(0,0,this.armcontextdata.width,this.armcontextdata.height);
	if(iters===undefined) iters=1;
	if(this.drawqueue.length==0) return false;
	if(iters<0 || iters>this.drawqueue.length) iters=this.drawqueue.length;
	var todraw;
	for (var i = 0; i < iters; i++) {
		todraw = this.drawqueue.splice(0,1)[0];
		this._trace(todraw[0],todraw[1],todraw[2], todraw[5]);
	};
	this._arms(todraw[3],todraw[4]);
	return true;
}
DrawerInterpreter.prototype._delta=function(da,db){
	var erra = (Math.random()<this.errrate);
	var errb = (Math.random()<this.errrate);
	var rda = erra ? this.lastda : da;
	var rdb = errb ? this.lastdb : db;

	var na = this.reala + rda;
	var nb = this.realb + rdb;
	this.drawqueue.push([this.getStepPosition(this.reala,this.realb), this.getStepPosition(na,nb), this.pen, na, nb, erra||errb]);
	
	this.reala = na;
	this.realb = nb;
	this.a += da;
	this.b += db;
	this.lastda = da;
	this.lastdb = db;
}
DrawerInterpreter.prototype.getStepPosition= function(a, b){
	var r1=this.r1, r2=this.r2, steps=this.steps;
	return {
			x:r1*Math.cos(a*TAU/steps) + r2*Math.cos((a+b)*TAU/steps) + this.pos.x,
			y:r1*Math.sin(a*TAU/steps) + r2*Math.sin((a+b)*TAU/steps) + this.pos.y
		};
}
DrawerInterpreter.prototype._loopDist=function(a,b){
	var absdist = Math.abs(a-b);
	return Math.min(absdist, this.steps-absdist);
}
DrawerInterpreter.prototype.trace=function(p1,p2){
	this._trace(p1,p2,this.pen);
}
DrawerInterpreter.prototype._arms=function(ang1,ang2){
	var r1=this.r1, r2=this.r2, steps=this.steps, pos = this.pos, context = this.armcontext;
	var pos1 = {
		x:pos.x + r1*Math.cos(ang1*TAU/steps),
		y:pos.y + r1*Math.sin(ang1*TAU/steps)
	};
	var pos2 = {
		x:pos1.x + r2*Math.cos((ang1+ang2)*TAU/steps),
		y:pos1.y + r2*Math.sin((ang1+ang2)*TAU/steps)
	};
	var pos1a = {
		x:pos1.x + 10*Math.sin((ang1+ang2)*TAU/steps),
		y:pos1.y - 10*Math.cos((ang1+ang2)*TAU/steps)
	};
	var pos1b = {
		x:pos1.x - 10*Math.sin((ang1+ang2)*TAU/steps),
		y:pos1.y + 10*Math.cos((ang1+ang2)*TAU/steps)
	};

	context.beginPath();
	context.moveTo(pos.x,pos.y);
	context.lineTo(pos1.x,pos1.y);
	context.lineCap="round";
	context.lineWidth = 20;
	context.strokeStyle = "black";
	context.stroke();

	context.beginPath();
	context.moveTo(pos1a.x,pos1a.y);
	context.lineTo(pos1b.x,pos1b.y);
	context.lineTo(pos2.x,pos2.y);
	context.closePath();
	context.fillStyle = "black";
	context.fill();

	
}
DrawerInterpreter.prototype._trace=function(p1,p2,pen, err){
	var context = this.context;
	context.beginPath();
	context.moveTo(p1.x,p1.y);
	context.lineTo(p2.x,p2.y);
	context.lineCap="round";
	switch(pen){
		case -1:
			context.lineWidth=1;
			context.strokeStyle = "rgba(0,0,0,0.1)";
			break;
		case 0:
			context.lineWidth=1;
			context.strokeStyle = "rgba(0,0,200,0.5)";
			if(err) context.strokeStyle = "rgba(200,0,0,0.5)";
			break;
		case 1:
			context.lineWidth=this.penwidth;
			context.strokeStyle = "rgba(0,0,255,1)";
			if(err) context.strokeStyle = "rgba(255,0,0,1)";
			break;
	}
  	context.stroke();
}