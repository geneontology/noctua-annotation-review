import { Injectable } from '@angular/core';
import * as jQuery from 'jquery';
import 'jqueryui';
import * as _ from 'lodash';
import * as joint from 'jointjs';
import * as shapes from './../models/shapes';
import * as Backbone from 'backbone';
import { getColor } from '@noctua.common/data/noc-colors';

export class StencilNode extends shapes.StencilNode {

  setColor(colorKey: string): this {
    const self = this;
    const deep = getColor(colorKey, 800);
    const light = getColor(colorKey, 100);

    self.attr('body/stroke', light);
    self.attr('statusLine/fill', deep);
    self.attr('statusType/fill', deep);
    self.attr('iconBackground/fill', light);

    return this;
  }

  setIcon(iconUrl: string) {
    const self = this;

    if (iconUrl) {
      self.attr('icon/xlink:href', `./assets/icons/core/SVG/${iconUrl}.svg`);
    }

    return this;
  }
}

export class NodeCell extends shapes.NodeCell {

  addNodePorts(): this {
    const self = this;

    return this;
  }

  addColor(colorKey: string): this {
    const self = this;
    const deep = getColor(colorKey, 800);
    const light = getColor(colorKey, 100);

    self.attr('body/stroke', light);
    self.attr('statusLine/fill', deep);
    self.attr('statusType/fill', deep);

    return this;
  }


  hover(on: boolean): this {
    const self = this;
    self.attr('wrapper/strokeWidth', on ? 20 : 0);

    return this;
  }
}

export class NodeLink extends shapes.NodeLink {
  static create() {
    const link = new NodeLink();
    link.prop({
      z: -1,
      labels: [{
        markup: [{
          tagName: 'rect',
          selector: 'labelBody'
        }, {
          tagName: 'text',
          selector: 'labelText'
        }],
        attrs: {
          labelText: {
            text: 'First',
            fill: '#7c68fc',
            fontSize: 10,
            fontFamily: 'sans-serif',
            textAnchor: 'middle',
            textVerticalAnchor: 'middle'
          },
          labelBody: {
            ref: 'labelText',
            refX: -5,
            refY: -5,
            refWidth: '100%',
            refHeight: '100%',
            refWidth2: 10,
            refHeight2: 10,
            stroke: '#7c68fc',
            fill: 'white',
            strokeWidth: 1,
            rx: 5,
            ry: 5
          }
        },
        position: {
          distance: -100,
          args: {
            // keepGradient: true,
            ensureLegibility: true,
          }
        }
      }],
    });
    link.router('manhattan', {
      step: 10,
      padding: 0,
      //  startDirections: ['bottom'],
      //   endDirections: ['top'],
    }).connector('normal');

    return link;
  }

  setText(text: string): this {
    const self = this;

    self.label(0, {
      attrs: {
        labelText: {
          text: text
        }
      }
    });

    return this;
  }
}

@Injectable({
  providedIn: 'root'
})
export class NoctuaShapesService {
  constructor() {
    this.initialize();
  }

  initialize() {

    const self = this;

    (Object as any).assign(joint.shapes, {
      noctua: {
        StencilNode: StencilNode,
        NodeCell: NodeCell,
        NodeCellList: shapes.NodeCellList,
        NodeLink: NodeLink
      }
    });

    const NodeCellBase = joint.dia.Element.define('noctua.NodeCellBase', {
      z: 3,
      attrs: {
        root: {
          pointerEvents: 'bounding-box',
          magnet: false
        },
        body: {
          strokeWidth: 2,
          fillOpacity: 0.2
        },
        label: {
          textWrap: {
            height: -20,
            width: -20,
            ellipsis: true
          },
          refX: '50%',
          refY: '50%',
          fontSize: 16,
          fontFamily: 'sans-serif',
          fill: '#333333',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle'
        }
      }
    }, {
      // Prototype
    }, {

    });

  }
}