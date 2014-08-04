This is the whiteboard drawing bot simulator and command generator. It has a few parts:

* *index.html* contains the basic logic and interface code.
* *shapeparser.js* is a PEG.js-generated parser that parses the shape language defined in *CommandDefs.md*
* *shapegen* defines ShapeGen, which has functions that enable construction and manipulation of path objects.
* *cmdgen.js* defines ArmCommandGen. Instances of this are responsible for translating shapes into movement commands.
* *drawerInterpreter.js* reads the movement commands and animates them on the canvas, using *adlparser.js* to parse the movement commands.

I used [PEG.js](http://pegjs.majda.cz/) to generate the parsers, [opentype.js](https://github.com/nodebox/opentype.js) to turn fonts into useable curves, [CodeMirror](http://codemirror.net/) for its scriptable editor, and [DAT.gui](http://workshop.chromeexperiments.com/examples/gui/) to control parameters.

You can see an overview of how everything works on my website [here][p1] and [here][p2].

[p1]: http://www.hexahedria.com/2014/08/04/whiteboard-drawing-bot-part-2-algorithms/
[p2]: http://www.hexahedria.com/2014/08/04/whiteboard-drawing-bot-part-3-editor/