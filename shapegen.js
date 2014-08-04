ShapeGen={};
ShapeGen.line = function(a,b){
	return [[ [a,b] ]];
}
ShapeGen.bezier = function(bezierpts){
	if(bezierpts.length == 3){
		//Quadratic bezier
		bezierpts = Geometry.quadraticToCubic(bezierpts);
	}
	if(bezierpts.length != 4) throw new Error("Bezier curve must have 3 or 4 points.")
	return [[ [bezierpts[0],bezierpts.slice(1,4)] ]];
}
ShapeGen.polyshape = function(polyshape){
	return [[ polyshape ]];
}
ShapeGen.complexObject = function(shapes){
	return [ shapes ];
}
ShapeGen.rect = function(x, y, width, height){
	return ShapeGen.polyshape([{x:x,y:y},{x:x,y:y+height},{x:x+width,y:y+height},{x:x+width,y:y},{x:x,y:y}]);
}
ShapeGen.circle = function(center,radius){
	var c = .551915024494;
	return ShapeGen.polyshape([
		{x:center.x+radius,y:center.y},
		[{x:center.x+radius,y:center.y-radius*c},{x:center.x+radius*c,y:center.y-radius}, {x:center.x,y:center.y-radius}],
		[{x:center.x-radius*c,y:center.y-radius},{x:center.x-radius,y:center.y-radius*c},{x:center.x-radius,y:center.y}],
		[{x:center.x-radius,y:center.y+radius*c},{x:center.x-radius*c,y:center.y+radius}, {x:center.x,y:center.y+radius}],
		[{x:center.x+radius*c,y:center.y+radius},{x:center.x+radius,y:center.y+radius*c},{x:center.x+radius,y:center.y}],
	]);
}
ShapeGen.textGlyphObjects = function(string, font, pos, fontsize){
	var group = [];
	font.forEachGlyph(string, pos.x, pos.y, fontsize, null, function(glyph, x, y, fsize, opts){
		var glyphPath = glyph.getPath(x,y,fsize);
		var shapes = ShapeGen._textShapes(glyphPath);
		var outpaths = [];
		for (var i = 0; i < shapes.length; i++) {
			var shape = shapes[i];
			outpaths[i]= ShapeGen.reverse(ShapeGen.polyshape(shape))[0][0];
		};
		group.push(outpaths);
	})
	return group;
}
ShapeGen._textShapes = function(path){
	var curpos = {x:0, y:0};
	var curoutpath = null;
	var outpaths = [];
	for (var i = 0; i < path.commands.length; i++) {
		var pathcmd = path.commands[i];
		switch(pathcmd.type){
			case 'M':
				curpos = {x:pathcmd.x, y:pathcmd.y};
				curoutpath=[curpos];
				outpaths.push(curoutpath);
				break;
			case 'L':
				curpos = {x:pathcmd.x, y:pathcmd.y};
				curoutpath.push(curpos);
				break;
			case 'C':
				curpos = {x:pathcmd.x, y:pathcmd.y};
				curoutpath.push([{x:pathcmd.x1,y:pathcmd.y1},{x:pathcmd.x2,y:pathcmd.y2},curpos]);
				break;
			case 'Q':
				var quadcurve = [curpos, {x:pathcmd.x1,y:pathcmd.y1},{x:pathcmd.x,y:pathcmd.y}];
				var cubic = Geometry.quadraticToCubic(quadcurve);
				curpos = cubic[3];
				curoutpath.push([cubic[1],cubic[2],cubic[3]]);
				break;
			case 'Z':
				if(!curoutpath || curoutpath.length==0) break;
				curpos = curoutpath[0];
				curoutpath.push(curpos);
				break;
		}
	};
	//console.log(outpaths);
	return outpaths;
}

ShapeGen.multiple = function(){
	var result = [];
	for (var i = 0; i < arguments.length; i++) {
		result = result.concat(arguments[i]);
	};
	return result;
}
ShapeGen.combineComplex = function(){
	var result = [];
	for (var i = 0; i < arguments.length; i++) {
		var current = arguments[i];
		for (var j = 0; j < current.length; j++) {
			var shape = current[j];
			result = result.concat(shape);
		};
	};
	return [result];
}
ShapeGen.reverse = function (objects){
	var newObjects = [];
	for (var i = 0; i < objects.length; i++) {
		var object = objects[i];
		var newObject = [];
		for (var j = 0; j < object.length; j++) {
			var shape = object[j];

			var rshape = [];
			var lastPt = shape[0];
			for (var k = 1; k < shape.length; k++) {
				var piece = shape[k];
				if(Array.isArray(piece)){
					rshape.splice(0,0,[piece[1], piece[0], lastPt]);
					lastPt = piece[2];
				}else{
					rshape.splice(0,0,lastPt);
					lastPt = piece;
				}
			};
			rshape.splice(0,0,lastPt);
			newObject[j] = rshape;
		};
		newObjects[i]=newObject;
	};
	return newObjects;
}
//matrix is [[a,b,c],
//			 [d,e,f],
//			 [0,0,1]]
ShapeGen.transform = function(objects, matrix){
	var newObjects = [];
	for (var i = 0; i < objects.length; i++) {
		var object = objects[i];
		var newObject = [];
		for (var j = 0; j < object.length; j++) {
			var shape = object[j];

			var nshape = [];
			for (var k = 0; k < shape.length; k++) {
				var piece = shape[k];
				if(Array.isArray(piece)){
					var npiece = [];
					for (var p = 0; p < piece.length; p++) {
						npiece.push(Geometry.transform(piece[p],matrix));
					};
					nshape.push(npiece);
				}else{
					nshape.push(Geometry.transform(piece,matrix));
				}
			};
			newObject[j] = nshape;
		};
		newObjects[i]=newObject;
	};
	return newObjects;
}

ShapeGen.scale = function(objects, scale){
	return ShapeGen.transform(objects, [
		[scale,0,0],
		[0,scale,0],
		[0,0,1],
	]);
}
ShapeGen.translate = function(objects, x,y){
	return ShapeGen.transform(objects, [
		[1,0,x],
		[0,1,y],
		[0,0,1],
	]);
}
ShapeGen.rotate = function(objects, a, pt){
	function rad(deg){
		return deg*TAU/360;
	}
	if(pt == undefined) pt = {x:0,y:0};
	return ShapeGen.transform(objects, [
		[Math.cos(rad(a)),-Math.sin(rad(a)),pt.x-pt.x*Math.cos(rad(a))+pt.y*Math.sin(rad(a))],
		[Math.sin(rad(a)),Math.cos(rad(a)),pt.y-pt.x*Math.sin(rad(a))-pt.y*Math.cos(rad(a))],
		[0,0,1],
	]);
}

ShapeGen.constrain = function(objects, x,y,w,h){
	var bounding = ShapeGen.boundingBox(objects);
	var bw = bounding.x2-bounding.x1,
		bh = bounding.y2-bounding.y1;
	if(bw > w || bh > h){
		var scale = Math.min(w/bw,h/bh);
		var nw = bw*scale,
			nh = bh*scale,
			nx1 = x + .5*(w-nw),
			ny1 = y + .5*(h-nh);
		return ShapeGen.transform(objects, [
			[scale,0, nx1 - bounding.x1*scale],
			[0,scale, ny1 - bounding.y1*scale],
			[0,0,1],
		]);
	}else{
		var dx=0,dy=0;
		if(bounding.x1 < x){
			dx = x-bounding.x;
		}else if(bounding.x2 > x+w){
			dx = (x+w)-bounding.x2;
		}
		if(bounding.y1 < y){
			dy = y-bounding.y;
		}else if(bounding.y2 > y+h){
			dy = (y+h)-bounding.y2;
		}
		if(dx == 0 && dy == 0) return objects;
		return ShapeGen.translate(objects, dx, dy);
	}
}
ShapeGen.boundingBox = function(objects){
	var bounds = {
		x1:Infinity,
		y1:Infinity,
		x2:-Infinity,
		y2:-Infinity,
	};
	for (var i = 0; i < objects.length; i++) {
		var object = objects[i];
		for (var j = 0; j < object.length; j++) {
			var shape = object[j];
			var lastPt = shape[0];
			bounds=Geometry.union(bounds,Geometry.rectifyPt(lastPt));
			for (var k = 1; k < shape.length; k++) {
				var piece = shape[k];
				if(Array.isArray(piece)){
					//Bezier
					bounds=Geometry.union(bounds,Geometry.bezierBoundingBox([lastPt].concat(piece)));
					lastPt=piece[2];
				}else{
					//Line
					bounds=Geometry.union(bounds,Geometry.rectifyPt(piece));
					lastPt=piece;
				}
			};
		};
	};
	return bounds;
}


ShapeGen.draw = function(objects,context){
	for (var i = 0; i < objects.length; i++) {
		var obj = objects[i];
		for (var j = 0; j < obj.length; j++) {
			var shapes = obj[j];
			context.beginPath();
			context.moveTo(shapes[0].x,shapes[0].y);
			for (var k = 1; k < shapes.length; k++) {
				if(Array.isArray(shapes[k])){
					context.bezierCurveTo(shapes[k][0].x,shapes[k][0].y,shapes[k][1].x,shapes[k][1].y,shapes[k][2].x,shapes[k][2].y);
				}else{
					context.lineTo(shapes[k].x, shapes[k].y);
				}
			};
  			context.stroke();
		};
	};
}

ShapeGen.parse = function(shapestring,fonts){
	//shapestring = shapestring.replace(/\s/g,"");
	return ShapeParser.parse(shapestring,{ShapeGen:ShapeGen,Geometry:Geometry,fonts:fonts});
}