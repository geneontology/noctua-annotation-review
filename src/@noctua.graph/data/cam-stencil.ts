import { AnnotonType, noctuaFormConfig } from "@noctua.form";
import { cloneDeep } from "lodash";

export interface StencilItemNode {
    id: string;
    label: string;
    type: AnnotonType,
}

export interface StencilItem {
    id: string;
    label: string;
    nodes: StencilItemNode[]
}


const camStencil: StencilItem[] = [{
    id: 'activity_unit',
    label: 'Activity Type',
    nodes: [{
        type: AnnotonType.default,
        id: noctuaFormConfig.annotonType.options.default.name,
        label: noctuaFormConfig.annotonType.options.default.label
    }, {
        type: AnnotonType.bpOnly,
        id: noctuaFormConfig.annotonType.options.bpOnly.name,
        label: noctuaFormConfig.annotonType.options.bpOnly.label
    }]
}]

export const noctuaStencil = {
    camStencil: cloneDeep(camStencil)
};

