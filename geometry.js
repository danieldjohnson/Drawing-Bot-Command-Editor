var Geometry = {};
Geometry.tolerance = .00000001;

//////// source: http://community.topcoder.com/tc?module=Static&d1=tutorials&d2=geometry2#line_line_intersection
Geometry.lineLineIntersect = function(s1,e1,s2,e2){
    var A1 = e1.y-s1.y,
        B1 = s1.x-e1.x,
        C1 = A1*s1.x + B1*s1.y,

        A2 = e2.y-s2.y,
        B2 = s2.x-e2.x,
        C2 = A2*s2.x + B2*s2.y,

        det = A1*B2 - A2*B1;
    if(det==0) return null;
    var x = (B2*C1 - B1*C2)/det,
        y = (A1*C2 - A2*C1)/det;

    var t1,t2;
    if(s1.x==e1.x && s1.y==e1.y) return null;
    var dx=e1.x-s1.x,
        dy=e1.y-s1.y;
    if(Math.abs(dx)>=Math.abs(dy)) t1 = (x-s1.x)/(e1.x-s1.x);
    else t1 = (y-s1.y)/(e1.y-s1.y);


    if(s2.x==e2.x && s2.y==e2.y) return null;
        dx=e2.x-s2.x;
        dy=e2.y-s2.y;
    if(Math.abs(dx)>=Math.abs(dy)) t2 = (x-s2.x)/(e2.x-s2.x);
    else t2 = (y-s2.y)/(e2.y-s2.y);


    if( t1<0-Geometry.tolerance || t1>1+Geometry.tolerance || t2<0-Geometry.tolerance || t2>1+Geometry.tolerance ) return null;
    return t1;
}
////////

////////Adapted from http://www.particleincell.com/blog/2013/cubic-line-intersection/
Geometry.bezierLineIntersect = function(bezier,startpt,endpt)
{
    var dx = endpt.x-startpt.x,
        dy = endpt.y-startpt.y;

    var A=endpt.y-startpt.y;	    //A=y2-y1
	var B=startpt.x-endpt.x;	    //B=x1-x2
	var C=startpt.x*(startpt.y-endpt.y) + 
          startpt.y*(endpt.x-startpt.x);	//C=x1*(y1-y2)+y1*(x2-x1)

	var bx = Geometry.bezierCoeffs(bezier[0].x,bezier[1].x,bezier[2].x,bezier[3].x);
	var by = Geometry.bezierCoeffs(bezier[0].y,bezier[1].y,bezier[2].y,bezier[3].y);
	
    var P = Array();
	P[0] = A*bx[0]+B*by[0];		/*t^3*/
	P[1] = A*bx[1]+B*by[1];		/*t^2*/
	P[2] = A*bx[2]+B*by[2];		/*t*/
	P[3] = A*bx[3]+B*by[3] + C;	/*1*/
	
	var r=Geometry.cubicRoots(P);
	
    /*verify the roots are in bounds of the linear segment*/
    for (var i=0;i<r.length;i++)
    {
        var t=r[i];
        
        var fx=bx[0]*t*t*t+bx[1]*t*t+bx[2]*t+bx[3];
        var fy=by[0]*t*t*t+by[1]*t*t+by[2]*t+by[3];            
            
        /*above is intersection point assuming infinitely long line segment,
          make sure we are also in bounds of the line*/
        var s;
        if(Math.abs(dx)>=Math.abs(dy))    /*use one with greatest distance*/
            s=(fx-startpt.x)/(endpt.x-startpt.x);
        else
            s=(fy-startpt.y)/(endpt.y-startpt.y);
        
        
        /*in bounds?*/    
        if (t<0-Geometry.tolerance || t>1.0+Geometry.tolerance || s<0-Geometry.tolerance || s>1.0+Geometry.tolerance)
        {
            r.splice(i,1);
            i--;
        }
    }

    return r;
    
}

/*based on http://mysite.verizon.net/res148h4j/javascript/script_exact_cubic.html#the%20source%20code*/
Geometry.cubicRoots = function(P)
{
	var a=P[0];
	var b=P[1];
	var c=P[2];
	var d=P[3];

    if(Math.abs(a)<Geometry.tolerance)return Geometry.quadraticRoots([b,c,d]);
	
	var A=b/a;
	var B=c/a;
	var C=d/a;

    var Q, R, D, S, T, Im;

    var Q = (3*B - Math.pow(A, 2))/9;
    var R = (9*A*B - 27*C - 2*Math.pow(A, 3))/54;
    var D = Math.pow(Q, 3) + Math.pow(R, 2);    // polynomial discriminant

    var t=Array();
	
    if (D >= 0)                                 // complex or duplicate roots
    {
        var S = Geometry.sgn(R + Math.sqrt(D))*Math.pow(Math.abs(R + Math.sqrt(D)),(1/3));
        var T = Geometry.sgn(R - Math.sqrt(D))*Math.pow(Math.abs(R - Math.sqrt(D)),(1/3));

        t[0] = -A/3 + (S + T);                    // real root
        t[1] = -A/3 - (S + T)/2;                  // real part of complex root
        t[2] = -A/3 - (S + T)/2;                  // real part of complex root
        Im = Math.abs(Math.sqrt(3)*(S - T)/2);    // complex part of root pair   
        
        /*discard complex roots*/
        if (Im!=0)
        {
            t[1]=-1;
            t[2]=-1;
        }
    
    }
    else                                          // distinct real roots
    {
        var th = Math.acos(R/Math.sqrt(-Math.pow(Q, 3)));
        
        t[0] = 2*Math.sqrt(-Q)*Math.cos(th/3) - A/3;
        t[1] = 2*Math.sqrt(-Q)*Math.cos((th + 2*Math.PI)/3) - A/3;
        t[2] = 2*Math.sqrt(-Q)*Math.cos((th + 4*Math.PI)/3) - A/3;
        Im = 0.0;
    }
    
    /*discard out of spec roots*/
	for (var i=0;i<t.length;i++) 
        if (t[i]<0 || t[i]>1.0){
            t.splice(i,1);
            i--;
        }
                
    t.sort(function(a,b){return a-b;});
    
    return t;
}
Geometry.quadraticRoots = function(P){
    var t;

    var A=P[0];
    var B=P[1];
    var C=P[2];


    if(Math.abs(A)<Geometry.tolerance)return Geometry.linearRoots([B,C]);

    var s= -B/(2*A);
    var desc = B*B - 4*A*C;
    if(desc<0){
        t=[];
    }else if(desc==0){
        t=[s];
    }else{
        var d= Math.sqrt(desc)/(2*A);
        t=[s+d,s-d];
    }

    /*discard out of spec roots*/
    for (var i=0;i<t.length;i++) 
        if (t[i]<0 || t[i]>1.0){
            t.splice(i,1);
            i--;
        }
                
    t.sort(function(a,b){return a-b;});
    return t;
}
Geometry.linearRoots = function(P){

    var A=P[0];
    var B=P[1];

    return [-B/A];

}
Geometry.sgn = function( x )
{
    if (x < 0.0) return -1;
    return 1;
}

Geometry.bezierCoeffs = function(P0,P1,P2,P3)
{
    var Z = Array();
    Z[0] = -P0 + 3*P1 + -3*P2 + P3; 
    Z[1] = 3*P0 - 6*P1 + 3*P2;
    Z[2] = -3*P0 + 3*P1;
    Z[3] = P0;
    return Z;
}
Geometry.bezierEval = function(bezier, t){
    var bx = Geometry.bezierCoeffs(bezier[0].x,bezier[1].x,bezier[2].x,bezier[3].x);
    var by = Geometry.bezierCoeffs(bezier[0].y,bezier[1].y,bezier[2].y,bezier[3].y);
    var fx=bx[0]*t*t*t+bx[1]*t*t+bx[2]*t+bx[3];
    var fy=by[0]*t*t*t+by[1]*t*t+by[2]*t+by[3]; 
    return {x:fx,y:fy}; 
}
////////

Geometry.quadraticToCubic = function(bezierpts){
    var cp1x = bezierpts[0].x + 2/3*(bezierpts[1].x-bezierpts[0].x),
        cp2x = bezierpts[2].x + 2/3*(bezierpts[1].x-bezierpts[2].x),
        cp1y = bezierpts[0].y + 2/3*(bezierpts[1].y-bezierpts[0].y),
        cp2y = bezierpts[2].y + 2/3*(bezierpts[1].y-bezierpts[2].y);
    var newpts = [bezierpts[0], {x:cp1x,y:cp1y}, {x:cp2x,y:cp2y}, bezierpts[2]];
    return newpts;
}

Geometry.union = function(rect1,rect2){
    return {
        x1:Math.min(rect1.x1,rect2.x1),
        y1:Math.min(rect1.y1,rect2.y1),
        x2:Math.max(rect1.x2,rect2.x2),
        y2:Math.max(rect1.y2,rect2.y2),
    };
}
Geometry.rectifyPt = function(pt){
    return {
        x1:pt.x,
        y1:pt.y,
        x2:pt.x,
        y2:pt.y,
    };
}
Geometry.bezierBoundingBox = function(bezier){
    var bounds = Geometry.union(Geometry.rectifyPt(bezier[0]),Geometry.rectifyPt(bezier[3]));

    var deriv = Geometry.cubicBezierDerivative(bezier);

    //Turn it into a cubic curve so that we can use our cubic solver (technically could use quadratic solver instead)
    var cubicDeriv = Geometry.quadraticToCubic(deriv);

    var bx = Geometry.bezierCoeffs(bezier[0].x,bezier[1].x,bezier[2].x,bezier[3].x);
    var by = Geometry.bezierCoeffs(bezier[0].y,bezier[1].y,bezier[2].y,bezier[3].y);

    var dx = Geometry.bezierCoeffs(cubicDeriv[0].x,cubicDeriv[1].x,cubicDeriv[2].x,cubicDeriv[3].x);
    var dy = Geometry.bezierCoeffs(cubicDeriv[0].y,cubicDeriv[1].y,cubicDeriv[2].y,cubicDeriv[3].y);

    var zeroes = [].concat(
            Geometry.cubicRoots(dx),
            Geometry.cubicRoots(dy)
        );

    for (var i = 0; i < zeroes.length; i++) {
        var t = zeroes[i];
        
        var fx=bx[0]*t*t*t+bx[1]*t*t+bx[2]*t+bx[3];
        var fy=by[0]*t*t*t+by[1]*t*t+by[2]*t+by[3];            
            
        /*in bounds?*/    
        if (t>0-Geometry.tolerance && t<1.0+Geometry.tolerance )
        {
            bounds=Geometry.union(bounds,Geometry.rectifyPt({x:fx,y:fy}));
        }
    };
    return bounds;
}
Geometry.cubicBezierDerivative = function(bezierpts){
    var D = [{},{},{}];
    D[0].x = 3*(bezierpts[1].x - bezierpts[0].x);
    D[1].x = 3*(bezierpts[2].x - bezierpts[1].x);
    D[2].x = 3*(bezierpts[3].x - bezierpts[2].x);
    D[0].y = 3*(bezierpts[1].y - bezierpts[0].y);
    D[1].y = 3*(bezierpts[2].y - bezierpts[1].y);
    D[2].y = 3*(bezierpts[3].y - bezierpts[2].y);
    return D;
}

//matrix is [[a,b,c],
//           [d,e,f],
//           [0,0,1]]
Geometry.transform = function(pt, matrix){
    return  {
        x: (pt.x*matrix[0][0] + pt.y*matrix[0][1] + matrix[0][2]),
        y: (pt.x*matrix[1][0] + pt.y*matrix[1][1] + matrix[1][2]),
    };
}
