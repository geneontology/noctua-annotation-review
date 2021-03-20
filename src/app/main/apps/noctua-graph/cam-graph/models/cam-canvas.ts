import { Annoton, Cam, Entity, noctuaFormConfig, Predicate, Triple } from '@noctua.form';
import { NodeCellType } from '@noctua.graph/models/shapes';
import { NodeCell, NodeLink, StencilNode } from '@noctua.graph/services/shapes.service';
import * as joint from 'jointjs';
import { each, cloneDeep } from 'lodash';

export class CamCanvas {

    canvasPaper: joint.dia.Paper;
    canvasGraph: joint.dia.Graph;
    selectedStencilElement;
    elementOnClick: (element: joint.shapes.noctua.NodeCell) => void;
    cam: Cam;

    constructor() {
        this._initializeCanvas()
    }

    private _initializeCanvas() {
        const self = this;
        self.canvasGraph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        self.canvasPaper = new joint.dia.Paper({
            cellViewNamespace: joint.shapes,
            el: document.getElementById('noc-paper'),
            height: '100%',
            width: '100%',
            model: this.canvasGraph,
            restrictTranslate: true,
            multiLinks: false,
            markAvailable: true,
            // defaultConnectionPoint: { name: 'boundary', args: { extrapolate: true } },
            // defaultConnector: { name: 'rounded' },
            // defaultRouter: { name: 'orthogonal' },
            /*     defaultLink: new joint.dia.Link({
                  attrs: { '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z' } }
                }), */
            validateConnection: function (cellViewS, magnetS, cellViewT, magnetT, end, linkView) {
                // Prevent linking from input ports.
                // if (magnetS && magnetS.getAttribute('port-group') === 'in') return false;
                // Prevent linking from output ports to input ports within one element.
                if (cellViewS === cellViewT) return false;
                // Prevent linking to input ports.
                /// return magnetT && magnetT.getAttribute('port-group') === 'in';

                return true; // (magnetS !== magnetT);
            },
            validateMagnet: function (cellView, magnet) {
                // Note that this is the default behaviour. Just showing it here for reference.
                // Disable linking interaction for magnets marked as passive (see below `.inPorts circle`).
                // return magnet.getAttribute('magnet') !== 'passive';
                return true;
            },

            // connectionStrategy: joint.connectionStrategies.pinAbsolute,
            // defaultConnectionPoint: { name: 'boundary', args: { selector: 'border' } },
            async: true,
            interactive: { labelMove: false },
            linkPinning: false,
            // frozen: true,
            gridSize: 10,
            drawGrid: {
                name: 'doubleMesh',
                args: [
                    { color: '#DDDDDD', thickness: 1 }, // settings for the primary mesh
                    { color: '#DDDDDD', scaleFactor: 5, thickness: 4 } //settings for the secondary mesh
                ]
            },
            sorting: joint.dia.Paper.sorting.APPROX,
            // markAvailable: true,
            defaultLink: function () {
                return self.addLink();
            },
            perpendicularLinks: true,
            // defaultRouter: {
            //   name: 'manhattan',
            //   args: {
            //  perpendicular: false,
            //    step: 20
            //    }
            //   },

        });

        this.canvasPaper.on({
            'element:pointerdblclick': function (cellView) {
                const element = cellView.model;
                self.elementOnClick(element);
            },
            'element:mouseover': function (cellView) {
                const element = cellView.model;
                if (element.get('type') === NodeCellType.cell) {
                    (element as NodeCell).hover(true);
                }
            },

            'element:mouseleave': function (cellView) {
                cellView.removeTools();
                const element = cellView.model;
                if (element.get('type') === NodeCellType.cell) {
                    (element as NodeCell).hover(false);
                }
            },
            /* 'element:pointerup': function (elementView, evt, x, y) {
                const coordinates = new joint.g.Point(x, y);
                const elementAbove = elementView.model;
                const elementBelow = this.model.findModelsFromPoint(coordinates).find(function (el) {
                    return (el.id !== elementAbove.id);
                });

                // If the two elements are connected already, don't
                if (elementBelow && self.canvasGraph.getNeighbors(elementBelow).indexOf(elementAbove) === -1) {

                    // Move the element to the position before dragging.
                    elementAbove.position(evt.data.x, evt.data.y);
                    self.createLinkFromElements(elementAbove, elementBelow)

                }
            },
            'element:gate:click': function (elementView) {
                const element = elementView.model;
                const gateType = element.gate();
                const gateTypes = Object.keys(element.gateTypes);
                const index = gateTypes.indexOf(gateType);
                const newIndex = (index + 1) % gateTypes.length;
                element.gate(gateTypes[newIndex]);
            } */
        });


        this.canvasPaper.on('link:pointerclick', function (linkView) {
            const link = linkView.model;

            self.elementOnClick(link);
            link.attr('line/stroke', 'orange');
            link.label(0, {
                attrs: {
                    body: {
                        stroke: 'orange'
                    }
                }
            });
        });

        this.canvasPaper.on('element:expand:pointerdown', function (elementView: joint.dia.ElementView, evt) {
            evt.stopPropagation(); // stop any further actions with the element view (e.g. dragging)

            const model = elementView.model;
            const annoton = model.prop('annoton') as Annoton;
            self.toggleAnnotonVisibility(model, annoton);
        });

        this.canvasGraph.on('change:source change:target', function (link) {
            const sourcePort = link.get('source').port;
            const sourceId = link.get('source').id;
            const targetPort = link.get('target').port;
            const targetId = link.get('target').id;

            if (targetId && sourceId) {
                self.canvasGraph.getCell(targetId);
                self.canvasGraph.getCell(targetId);
            }

        });
    }

    addElement(element: joint.shapes.noctua.NodeCell): NodeCell {
        const self = this;

        const annoton: Annoton = element.get('annoton');
        const el = new NodeCell()
            .position(0, 0)
            .size(120, 100)

        // el.attr({ nodeType: { text: annoton.category } });
        el.attr({ noctuaTitle: { text: annoton.title } });

        // el.set({ annoton: new Annoton(annoton) });

        self.canvasGraph.addCell(el);

        return el;
    }

    addLink(): NodeLink {
        const self = this;
        const link = NodeLink.create();
        const predicate: Predicate = new Predicate(Entity.createEntity(noctuaFormConfig.edge.causallyUpstreamOf));

        link.set({
            annoton: predicate,
            id: predicate.uuid
        });

        link.setText(predicate.edge.label);

        // Add remove button to the link.
        const tools = new joint.dia.ToolsView({
            tools: [new joint.linkTools.Remove()]
        });
        // link.findView(this).addTools(tools);

        return link;
    }

    createLinkFromElements(source: joint.shapes.noctua.NodeCell, target: joint.shapes.noctua.NodeCell) {
        const self = this;

        const subject = source.get('annoton') as Annoton;
        const object = target.get('annoton') as Annoton;

        self.createLink(subject, new Predicate(Entity.createEntity(noctuaFormConfig.edge.causallyUpstreamOf)), object)
    }

    createLink(subject: Annoton, predicate: Predicate, object: Annoton) {
        const self = this;
        const triple = new Triple(subject, predicate, object);

        ///self.cam.addNode(predicate);
        //self.cam.addTriple(triple);
        self.createLinkFromTriple(triple, true);
    }

    createLinkFromTriple(triple: Triple<Annoton>, autoLayout?: boolean) {
        const self = this;

        const link = NodeLink.create();
        link.setText(triple.predicate.edge.label);
        link.set({
            annoton: triple.predicate,
            id: triple.predicate.edge.id,
            source: {
                id: triple.subject.id,
                port: 'right'
            },
            target: {
                id: triple.object.id,
                port: 'left'
            }
        });

        link.addTo(self.canvasGraph);
        if (autoLayout) {
            self._layoutGraph(self.canvasGraph);
            // self.addCanvasGraph(self.annoton);
        }
    }

    paperScale(delta: number, e) {
        const el = this.canvasPaper.$el;
        const newScale = this.canvasPaper.scale().sx + delta;

        if (newScale > 0.1 && delta < 10) {
            const offsetX = (e.offsetX || e.clientX - el.offset().left);
            const offsetY = (e.offsetY || e.clientY - el.offset().top);
            const localPoint = this._offsetToLocalPoint(offsetX, offsetY);

            this.canvasPaper.translate(0, 0);
            this.canvasPaper.scale(newScale, newScale, localPoint.x, localPoint.y);
        }
    };

    zoom(delta: number, e?) {
        if (e) {
            this.paperScale(delta, e);
        } else {
            this.canvasPaper.translate(0, 0);
            this.canvasPaper.scale(delta, delta)
        }
    }

    resetZoom() {
        this.zoom(1);
    };

    toggleAnnotonVisibility(cell: joint.dia.Element, annoton: Annoton) {
        const self = this;

        console.log(cell.position())

        //self.annoton.subgraphVisibility(annoton, !annoton.expanded);
        const elements = self.canvasGraph.getSuccessors(cell).concat(cell);
        // find all the links between successors and the element
        const subgraph = self.canvasGraph.getSubgraph(elements);

        if (annoton.expanded) {
            subgraph.forEach((element) => {
                element.attr('./visibility', 'hidden');
            });
        } else {
            subgraph.forEach((element) => {
                element.attr('./visibility', 'visible');
            });
        }

        cell.attr('./visibility', 'visible');
        annoton.expanded = !annoton.expanded;

        self._layoutGraph(self.canvasGraph);

        self.canvasPaper.translate(0, 0);

        //  self.canvasPaper.
    }

    addCanvasGraph(cam: Cam) {
        const self = this;
        const nodes = [];

        self.cam = cam;
        self.canvasGraph.resetCells(nodes);

        each(cam.annotons, (annoton: Annoton) => {
            if (annoton.visible) {

                const el = new NodeCell()
                //.addAnnotonPorts()
                // .addColor(annoton.backgroundColor)
                //.setSuccessorCount(annoton.successorCount)

                el.attr({ nodeType: { text: annoton.id ? annoton.annotonType : 'Activity Unity' } });
                el.attr({ noctuaTitle: { text: annoton.id ? annoton.title : 'New Annoton' } });
                el.attr({
                    expand: {
                        event: 'element:expand:pointerdown',
                        stroke: 'black',
                        strokeWidth: 2
                    },
                    expandLabel: {
                        fontSize: 8,
                        fontWeight: 'bold'
                    }
                })
                el.set({
                    annoton: annoton,
                    id: annoton.id,
                    position: annoton.position,
                    size: annoton.size,
                });

                nodes.push(el);
            }
        });

        each(cam.triples, (triple: Triple<Annoton>) => {
            if (triple.predicate.visible) {
                const link = NodeLink.create();
                link.setText(triple.predicate.edge.label);
                link.set({
                    annoton: triple.predicate,
                    id: triple.predicate.edge.id,
                    source: {
                        id: triple.subject.id,
                        port: 'right'
                    },
                    target: {
                        id: triple.object.id,
                        port: 'left'
                    }
                });

                nodes.push(link);
            }
        });

        self.canvasPaper.scaleContentToFit({ minScaleX: 0.3, minScaleY: 0.3, maxScaleX: 1, maxScaleY: 1 });
        self.canvasPaper.setDimensions('10000px', '10000px')
        self.canvasGraph.resetCells(nodes);
        self._layoutGraph(self.canvasGraph);
        self.canvasPaper.unfreeze();
        self.canvasPaper.render();
    }

    addStencilGraph(graph: joint.dia.Graph, annotons: Annoton[]) {
        const self = this;
        const nodes = [];

        each(annotons, (annoton: Annoton) => {
            const el = new StencilNode()
            // .size(120, 80)
            // .setColor(annoton.backgroundColor)
            //.setIcon(annoton.iconUrl);
            el.attr('label/text', annoton.title);
            el.set({ annoton: cloneDeep(annoton) });

            nodes.push(el);
        });

        graph.resetCells(nodes);
        self._layout(graph);
    }

    private _layout(graph: joint.dia.Graph) {
        let currentY = 10;
        graph.getElements().forEach((el) => {
            //Sel.getBBox().bottomRight();
            el.position(10, currentY);
            currentY += el.size().height + 10;
        });
    }

    private _layoutGraph(graph) {
        const autoLayoutElements = [];
        const manualLayoutElements = [];
        graph.getElements().forEach((el) => {
            if (el.attr('./visibility') !== 'hidden') {
                autoLayoutElements.push(el);
            }
        });
        // Automatic Layout
        joint.layout.DirectedGraph.layout(graph.getSubgraph(autoLayoutElements), {
            align: 'UR',
            setVertices: true,
            setLabels: true,
            marginX: 50,
            marginY: 50,
            rankSep: 200,
            // nodeSep: 2000,
            //edgeSep: 2000,
            rankDir: "LR"
        });
        // Manual Layout
        manualLayoutElements.forEach(function (el) {
            const neighbor = graph.getNeighbors(el, { inbound: true })[0];
            if (!neighbor) return;
            const neighborPosition = neighbor.getBBox().bottomRight();
            el.position(neighborPosition.x + 20, neighborPosition.y - el.size().height / 2 - 20);
        });
    }

    private _offsetToLocalPoint(x, y) {
        const self = this;

        const svgPoint = joint.Vectorizer.createSVGPoint(x, y);
        // Transform point into the viewport coordinate system.
        const pointTransformed = svgPoint.matrixTransform(self.canvasPaper.viewport.getCTM().inverse());
        return pointTransformed;
    }
}