import { FormGroup, AbstractControl, ValidatorFn, FormControl } from '@angular/forms';
import { AnnotonNode } from './../../..//models/annoton';

export function evidenceValidator(termNode: AnnotonNode): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        if (termNode.hasValue()) {
            if (control.value) {
                if (!control.value.id) {
                    console.log('-', termNode.getTerm(), termNode.label, control);
                    return { [`Selevt correct evidence for "${termNode.label}" correct value`]: { value: control.value } };
                }
            } else {
                console.log('+', termNode.getTerm(), termNode.label, control);
                return { [`Evidence for "${termNode.label}" is required`]: { value: control.value } };
            }
        }
        return null;
    };
}
