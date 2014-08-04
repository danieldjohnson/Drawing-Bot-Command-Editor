## Simple commands

	rect[x,y,w,h]
	circle[x,y,radius]

	line[x1,y1,x2,y2]
	curve[x1,y1,x2,y2,x3,y3]
	curve[x1,y1,x2,y2,x3,y3,x4,y4]

	path[(x,y),(x,y),<x,y>,(x,y),<x,y>,<x,y>,(x,y),...] # () are on curve, <> are off curve
	text["string with \"escapes\"", x,y, size, "fontname"]

## Manipulations and grouping

	complex{ ... }
	reverse{ ... } or ~cmd

## Transformations

	translate[dx,dy]{ ... }
	rotate[angle]{ ... }
	rotate[angle, x,y]{ ... }
	scale[factor]{ ... }

	constrain[x,y,w,h]{ ... }





# For PEG.js parser generator

# Drawer language

	start
	  = cmdseq

	cmdseq
	  = left:cmd right:cmdseq { return [left].concat(right); }
	  / left:cmd { return [left]; }

	cmd "command"
	  = "M" left:integer "," right:integer {return {action:"move", a:left, b:right}; }
	  / "Pd" {return {action:"pen", pos:"down"}; }
	  / "Pu" {return {action:"pen", pos:"up"}; }
	  / "Pr" {return {action:"pen", pos:"retract"}; }
	  / "A" path:advances {return {action:"advance", path:path}; }
	  / "Sa" sign:sign length:integer {return {action:"sweep", dir:"a", sign:sign, len:length}; }
	  / "Sb" sign:sign length:integer {return {action:"sweep", dir:"b", sign:sign, len:length}; }
	 
	sign "sign"
	  = "+" { return 1; }
	  / "0" { return 0; }
	  / "-" { return -1; }

	advances
	  = left:advance right:advances {return [left].concat(right); }
	  / left:advance {return [left]; }

	advance
	  = a:sign b:sign { return [a,b];}


	integer "integer"
	  = digits:[0-9]+ { return parseInt(digits.join(""), 10); }

# Shape language

	{
		var SG = options.ShapeGen;
		var GEO = options.Geometry;
		var FONTS = options.fonts;
	}

	start
	 	=  s* items:items s* {return items;}

	items
		= left:item s* right:items { return SG.multiple(left,right); }
		/ item

	item
		= unit / grouping

	unit
		= 'rect[' s*  x:number s* ',' s* y:number s* ',' s* w:number s* ',' s* h:number s* ']' { return SG.rect(x,y,w,h); }
		/ 'circle[' s* x:number s* ',' s* y:number s* ',' s* r:number s* ']' { return SG.circle({x:x,y:y},r); }
		/ 'line[' s* x1:number s* ',' s* y1:number s* ',' s* x2:number s* ',' s* y2:number s* ']' { return SG.line({x:x1,y:y1},{x:x2,y:y2}); }
		/ 'curve[' s* x1:number s* ',' s* y1:number s* ',' s* x2:number s* ',' s* y2:number s* ',' s* x3:number s* ',' s* y3:number s* ']' { return SG.bezier([{x:x1,y:y1},{x:x2,y:y2},{x:x3,y:y3}]); }
		/ 'curve[' s* x1:number s* ',' s* y1:number s* ',' s* x2:number s* ',' s* y2:number s* ',' s* x3:number s* ',' s* y3:number s* ',' s* x4:number s* ',' s* y4:number s* ']' { return SG.bezier([{x:x1,y:y1},{x:x2,y:y2},{x:x3,y:y3},{x:x4,y:y4}]); }
		/ 'path[' s* path:path s* ']' s* { return SG.polyshape(path); }
		/ 'text[' s* str:string s* ',' s* x:number s* ',' s* y:number s* ',' s* fs:number s* ',' s* font:string s* ']' { return SG.textGlyphObjects(str,FONTS[font],{x:x,y:y},fs); }

	grouping
		= 'translate[' s* dx:number s* ',' s* dy:number s* ']{' s* contents:items s* '}' { return SG.translate(contents,dx,dy); }
		/ 'rotate[' s* angle:number s* ']{' s* contents:items s* '}' { return SG.rotate(contents,angle); }
		/ 'rotate[' s* angle:number s* ',' s* x:number s* ',' s* y:number s* ']{' s* contents:items s* '}' { return SG.rotate(contents,angle,{x:x,y:y}); }
		/ 'scale[' s* factor:number s* ']{' s* contents:items s* '}' { return SG.scale(contents,factor); }
		/ 'complex{' s* contents:items s* '}' { return SG.combineComplex(contents); }
		/ 'reverse{' s* contents:items s* '}' { return SG.reverse(contents); }
		/ '~' obj:item { return SG.reverse(obj); }

	path
		= pt:pathtail {return [pt.first].concat(pt.rest)}

	pathtail
		= l:point s* ',' s* next:pathtail { return {first:l, rest:[next.first].concat(next.rest)}; }
		/ l:point s* ',' s* c:offcurve s* ',' s* next:pathtail { return {first:l, rest:[GEO.quadraticToCubic([l,c,next.first]).slice(1,4)].concat(next.rest)}; }
		/ l:point s* ',' s* c1:offcurve s* ',' s* c2:offcurve s* ',' s* next:pathtail { return {first:l, rest:[[c1,c2,next.first]].concat(next.rest)}; }
		/ l:point { return {first:l, rest:[]}; }

	point
		= '(' s* x:number s* ',' s* y:number s* ')' { return {x:x,y:y}; }
	offcurve
		= '<' s* x:number s* ',' s* y:number s* '>' { return {x:x,y:y}; }

	string 'a string'
		= '"' 
			strchars:(	  ('\\' '\\' {return '\\';}) 
						/ ('\\' '"' {return '"';}) 
						/ (!'"' c:.  {return c;}) 
			)* '"' { return strchars.join(''); }

	number 'a number'
		= digits:[0-9.]+ {return parseFloat(digits.join(''));}
		/ '-' digits:[0-9.]+ {return -parseFloat(digits.join(''));}

	s 'a whitespace character' = [ \f\n\r\t\v​\u00a0\u1680​\u180e\u2000​\u2001\u2002​\u2003\u2004​ \u2005\u2006​\u2007\u2008​\u2009\u200a​\u2028\u2029​​\u202f\u205f​\u3000]