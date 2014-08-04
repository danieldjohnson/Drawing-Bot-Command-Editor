var TAU = 2*Math.PI;
function ArmCommandGen(r1, r2, steps){
	this.r1 = r1;
	this.r2 = r2;
	this.steps = steps;
}
ArmCommandGen.prototype.getClosestStep=function(x, y){
	var r1=this.r1, r2=this.r2, steps=this.steps;

	var angle = Math.atan2(y, x);
	var lensq = x*x + y*y;

	if(lensq+Geometry.tolerance > (r1+r2)*(r1+r2)){
		var ang1 = Math.round(angle/TAU*steps);
		var ang2 = 0;

		if(ang1<0) ang1+=steps;
		return {ang1:ang1, ang2:ang2};
	}
	else if(lensq-Geometry.tolerance < (r1-r2)*(r1-r2)){
		var ang1 = Math.round(angle/TAU*steps);
		var ang2 = Math.floor(steps/2);

		if(ang1<0) ang1+=steps;
		return {ang1:ang1, ang2:ang2};
	}

	var armbend = Math.acos( -(r1*r1 + r2*r2 - lensq)/(2*r1*r2) );
	var primaryDiff = -Math.acos( (r1*r1 + lensq - r2*r2)/(2*r1*Math.sqrt(lensq)) );

	var perfect1 = (angle+primaryDiff)/TAU*steps;
	var perfect2 = (armbend)/TAU*steps;

	var idealPt = {x:x,y:y};

	var best = [Math.floor(perfect1),Math.floor(perfect2)];
	var bestDist = ArmCommandGen._pointDistSq(idealPt, this.getStepPosition(best[0],best[1]));

	var test = [Math.floor(perfect1),Math.ceil(perfect2)];
	var testDist = ArmCommandGen._pointDistSq(idealPt, this.getStepPosition(test[0],test[1]));
	if(testDist<bestDist){ best=test; bestDist=testDist; }

	var test = [Math.ceil(perfect1),Math.ceil(perfect2)];
	var testDist = ArmCommandGen._pointDistSq(idealPt, this.getStepPosition(test[0],test[1]));
	if(testDist<bestDist){ best=test; bestDist=testDist; }

	var test = [Math.ceil(perfect1),Math.floor(perfect2)];
	var testDist = ArmCommandGen._pointDistSq(idealPt, this.getStepPosition(test[0],test[1]));
	if(testDist<bestDist){ best=test; bestDist=testDist; }

	var ang1 = best[0];
	var ang2 = best[1];

	if(ang1<0) ang1+=steps;
	return {ang1:ang1, ang2:ang2};
}
ArmCommandGen._pointDistSq=function(p1,p2){
	var dx = p2.x-p1.x,
		dy = p2.y-p1.y;
	return dx*dx+dy*dy;
}
ArmCommandGen.prototype.getStepPosition= function(ang1, ang2){
	var r1=this.r1, r2=this.r2, steps=this.steps;
	if(ang2 <0 )
		return { x:(r1+r2)*10*Math.cos(ang1*TAU/steps),
				 y:(r1+r2)*10*Math.sin(ang1*TAU/steps) }
	if(ang2>this.steps/2)
		return {x:0,y:0};
	return {
			x:r1*Math.cos(ang1*TAU/steps) + r2*Math.cos((ang1+ang2)*TAU/steps),
			y:r1*Math.sin(ang1*TAU/steps) + r2*Math.sin((ang1+ang2)*TAU/steps)
		};
}
ArmCommandGen._closestPt= function(poly,pt){
	var best, found=null;
	for (var i = 0; i < poly.length; i++) {
		var dist = ArmCommandGen._pointDistSq(poly[i],pt);
		if(!found || dist<best){
			found=poly[i];
			best=dist;
		}
	};
	return found;
}
/**
 *	This is an approximator for a path that is assumed to be much smoother than the step resolution
 * 
 *	pathfn should be function([{x:x,y:y},...],optionalstate) that returns
 *	next point of intersection between the path and the polygon. The optionalstate
 *	is passed unchanged from call to call and can be used to store progress along path.
 *	If the path does not intersect the polygon, return the endpoint.
 *	
 *	Return {point:{x:x,y:y}, continues:bool}
 *	Return {point:{x:x,y:y}, segment:firstPolgonPoint (if continues), continues:bool}
 */
ArmCommandGen.prototype.drawPath=function(pathfn, initialpoint, state){

	var r1=this.r1, r2=this.r2, steps=this.steps;
	var curpos = initialpoint;
	var curstep = this.getClosestStep(curpos.x, curpos.y);
	var stepset = [curstep];
	while(true){
		var polygon = [];
		polygon.push(this.getStepPosition(curstep.ang1-1, curstep.ang2-1));
		polygon.push(this.getStepPosition(curstep.ang1-1, curstep.ang2  ));
		polygon.push(this.getStepPosition(curstep.ang1-1, curstep.ang2+1));
		polygon.push(this.getStepPosition(curstep.ang1  , curstep.ang2+1));
		polygon.push(this.getStepPosition(curstep.ang1+1, curstep.ang2+1));
		polygon.push(this.getStepPosition(curstep.ang1+1, curstep.ang2  ));
		polygon.push(this.getStepPosition(curstep.ang1+1, curstep.ang2-1));
		polygon.push(this.getStepPosition(curstep.ang1  , curstep.ang2-1));
		var pathval = pathfn(polygon,state);
		curpos = pathval.point;
		if(!pathval.continues)
			break;
		var closestExit = ArmCommandGen._closestPt([polygon[pathval.segment],polygon[(pathval.segment+1)%8]],curpos);
		curstep = this.getClosestStep(closestExit.x,closestExit.y);
		stepset.push(curstep);
	}
	var curstep = this.getClosestStep(curpos.x, curpos.y);
	stepset.push(curstep);
	return stepset;	
}
ArmCommandGen.prototype.polyShape = function(shapes,unchanged){
	if(!unchanged){
		//Expand form to full
		var newshapes = []
		var lastpt = shapes[0];
		for (var i = 1; i < shapes.length; i++) {
			var shape=shapes[i];
			newshapes.push([lastpt].concat(shape))
			if(Array.isArray(shape)){
				lastpt = shape[shape.length-1];
			}else{
				lastpt = shape;
			}
		};
		shapes=newshapes;
	}
	//console.log(JSON.stringify(shapes));
	function shapeFn(points,state){
			//console.log("STEP");
		var shape = shapes[state.shapeIdx];
		var prog = state.progress;
		//console.log(prog);
		var bestprog = 2;
		var best = null;
		var found = false;
		for (var i = 0; i < points.length; i++) {
			var cp=points[i],
				np=points[(i+1)%points.length];
			var intersects;
			if(shape.length==4){
				//Bezier!
				intersects =  Geometry.bezierLineIntersect(shape,cp,np);
			}else{
				//Line!
				intersects = [Geometry.lineLineIntersect(shape[0],shape[1],cp,np)];
			}
			//console.log(intersects);
			for (var j = 0; j < intersects.length; j++) {
				var intersect = intersects[j];
				//if(intersect) console.log(i," ",j," ",intersect);
				if(intersect && intersect > prog && intersect < bestprog){
					bestprog = intersect;
					best = i;
					found = true;
				}
			};
		};
		if(found){
			//console.log("->");
			state.progress = bestprog;
			var pt;
			if(shape.length==4){
				//Bezier!
				pt =  Geometry.bezierEval(shape,bestprog);
			}else{
				//Line!
				pt = {
					x:shape[0].x+(shape[1].x-shape[0].x)*bestprog,
					y:shape[0].y+(shape[1].y-shape[0].y)*bestprog,
				};
			}
			return {
				point:pt,
				segment:best,
				continues:true
			};
		}
		else if(state.shapeIdx < shapes.length-1){
			//console.log(">>>>");
			//Recurse to the next shape
			state.shapeIdx++;
			state.progress=0;
			return shapeFn(points, state);
		}
		else {
			//console.log(">>!");
			state.progress = 1;
			var pt;
			if(shape.length==4){
				//Bezier!
				pt =  Geometry.bezierEval(shape,1);
			}else{
				//Line!
				pt =  shape[1];
			}
			return {
				point:pt,
				continues:false
			};
		}
	}
	return this.drawPath(shapeFn,shapes[0][0],{progress:0,shapeIdx:0});
}


ArmCommandGen.prototype.strokePath=function(path){
	var steps=this.steps;
	var prev = path[0];
	var cmds = ["Pu","M"+prev.ang1+","+prev.ang2,"Pd","A"];
	for (var i = 1; i < path.length; i++) {
		var next=path[i];
		var d1 = next.ang1-prev.ang1;
		if(d1>1) d1-=steps;
		if(d1<-1) d1+=steps;
		var c1 = d1==0 ? "0" : d1<0 ? "-" : "+";

		var d2 = next.ang2-prev.ang2;
		if(d2>1) d2-=steps;
		if(d2<-1) d2+=steps;
		var c2 = d2==0 ? "0" : d2<0 ? "-" : "+";
		cmds.push(c1,c2);
		prev=next;
	};
	return cmds.join("");
}
ArmCommandGen.prototype.strokeMultiplePaths=function(paths){
	var cmds = [];
	for (var i = 0; i < paths.length; i++) {
		cmds.push(this.strokePath(paths[i]));
	}
	return cmds.join("");
}

ArmCommandGen.prototype._loopDist=function(a,b){
	var absdist = Math.abs(a-b);
	return Math.min(absdist, this.steps-absdist);
}
ArmCommandGen.prototype.fillPath=function(path,skip){
	return this.fillMultiplePaths([path],skip);
}
ArmCommandGen.prototype.fillMultiplePaths=function(paths,fillinterval){
	fillinterval = fillinterval || 1;
	var crossthroughs = [];
	var cmds = ["Pu"];
	for (var i = 0; i < paths.length; i++) {
		var path = paths[i];
		var newStart = 0;
		var prevpt = path[path.length-1];
		for (var j = 0; j < path.length; j++) {
			var pt = path[j];
			if(pt.ang2 != prevpt.ang2){
				newStart = j;
				break;
			}
		};
		var newpath = path.slice(newStart,path.length).concat(path.slice(0,newStart));

		prevpt = newpath[newpath.length-1];
		for (var j = 0; j < newpath.length;) {
			var first = newpath[j];
			var k;
			for (k = j+1; k < newpath.length && newpath[k].ang2 == first.ang2; k++){
				//No op
			};
			var last = newpath[k-1];
			var after = newpath[k%newpath.length];
			if(first.ang2 > prevpt.ang2){
				if(after.ang2 > first.ang2){
					if(!crossthroughs[first.ang2])  crossthroughs[first.ang2]=[];
					crossthroughs[first.ang2].push({ang1:first.ang1, type:"start"});
				}//else ignore
			}else{ //must be less than
				if(after.ang2 < last.ang2){
					if(!crossthroughs[last.ang2])  crossthroughs[last.ang2]=[];
					crossthroughs[last.ang2].push({ang1:last.ang1, type:"end"});
				}//else ignore
			}
			prevpt=last;
			j=k;
		};
	};
	//console.log(crossthroughs);
	var curpos = 0;
	for(var ang2 in crossthroughs){
		if(ang2%fillinterval!=0)continue;
		var curcross = crossthroughs[ang2];
		if(curcross.length<2 || curcross.length%2 != 0) continue;
		curcross.sort(function(a,b){
			if(a.ang1==b.ang1){
				if(a.type=="start"){
					if(b.type=="start"){
						return 0
					}else{
						return -1;
					}
				}else{
					if(b.type=="start"){
						return 1
					}else{
						return 0;
					}
				}
			}
			return a.ang1 - b.ang1;
		});
		var newcross=[]
		for (var i = 0; i < curcross.length; ) {
			var startct = curcross[i].type == "start";
			var endct = curcross[i].type == "end";
			for (var j = i+1; j < curcross.length && curcross[i].ang1 == curcross[j].ang1; j++) {
				if(curcross[j].type=="start")
					startct++;
				else
					endct++;
			};
			if(startct>endct)
				newcross.push({ang1:curcross[i].ang1, type:"start"});
			else if(startct<endct)
				newcross.push({ang1:curcross[i].ang1, type:"end"});
			i = j;
		};
		curcross=newcross;
		if(curcross.length<2) continue;
		
		if(curcross[0].type=="end"){
			var temp = curcross.splice(0,1)[0];
			temp.ang1+=this.steps;
			curcross.push(temp);
		}

		while(curcross.length>0){
			var best = 0,
				bestDist = this._loopDist(curpos,curcross[0].ang1);
			for (var i = 1; i < curcross.length; i++) {
				var ndist = this._loopDist(curpos,curcross[i].ang1);
				if(ndist<bestDist){
					best = i;
					bestDist=ndist;
				}
			};
			if(curcross[best].type=="start"){
				if(best+1>=curcross.length || curcross[best+1].type!="end") {
					console.warn("Bad Fill Shape at ",curcross[best].ang1,ang2,": Start, Start");
					console.log(curcross);
					console.log(crossthroughs[ang2]);
					curcross.splice(best,1);
					continue;
				}
				var cpos = curcross[best].ang1,
					npos = curcross[best+1].ang1;
				cmds.push("M",curcross[best].ang1,",",ang2);
				cmds.push("Pd");
				cmds.push("Sa+",npos-cpos);
				cmds.push("Pu");
				curcross.splice(best,2);
				curpos = npos;
			}else{
				if(best-1<0 || curcross[best-1].type!="start") {
					console.warn("Bad Fill Shape at ",curcross[best].ang1,ang2,": End, End");
					console.log(curcross);
					console.log(crossthroughs[ang2]);
					curcross.splice(best,1);
					continue;
				}
				var cpos = curcross[best].ang1,
					npos = curcross[best-1].ang1;
				cmds.push("M",curcross[best].ang1,",",ang2);
				cmds.push("Pd");
				cmds.push("Sa-",cpos-npos);
				cmds.push("Pu");
				curcross.splice(best-1,2);
				curpos = npos;
			}
		}
	}
	return cmds.join("");
}

ArmCommandGen.prototype.generateObjectPaths=function(shapeobjs){
	var objpaths = [];
	for (var i = 0; i < shapeobjs.length; i++) {
		var shapeobj = shapeobjs[i];
		var objpath = [];
		for (var j = 0; j < shapeobj.length; j++) {
			var shape = shapeobj[j];
			var path = this.polyShape(shape);
			objpath.push(path);
		};
		objpaths.push(objpath);
	};
	return objpaths;
}

ArmCommandGen.prototype.fillObjects=function(objs,skip){
	var cmds=[];
	for (var i = 0; i < objs.length; i++) {
		cmds = cmds.concat(this.fillMultiplePaths(objs[i],skip));
	};
	return cmds.join("");
}
ArmCommandGen.prototype.strokeObjects=function(objs){
	var cmds=[];
	for (var i = 0; i < objs.length; i++) {
		cmds = cmds.concat(this.strokeMultiplePaths(objs[i]));
	};
	return cmds.join("");
}
ArmCommandGen.prototype.fillAndStrokeObjects=function(objs,skip){
	var cmds=[];
	for (var i = 0; i < objs.length; i++) {
		cmds = cmds.concat(this.fillMultiplePaths(objs[i],skip),this.strokeMultiplePaths(objs[i]));
	};
	return cmds.join("");
}