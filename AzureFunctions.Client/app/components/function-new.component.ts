import {Component, ElementRef, Inject, Output, Input, EventEmitter, OnInit, AfterViewInit} from 'angular2/core';
import {NgClass} from 'angular2/common';
import {FunctionsService} from '../services/functions.service';
import {BindingComponent} from './binding.component';
import {TemplatePickerComponent} from './template-picker.component';
import {TemplatePickerType} from '../models/template-picker';
import {UIFunctionConfig, UIFunctionBinding, DirectionType, BindingType} from '../models/binding';
//import {LanguageType, FunctionTemplate} from '../models/template';
import {BindingList} from '../models/binding-list';
import {FunctionInfo} from '../models/function-info';
import {BindingManager} from '../models/binding-manager';
import {FunctionTemplate} from '../models/function-template';

declare var jQuery: any;

@Component({
    selector: 'function-new',
    templateUrl: './templates/function-new.component.html',
    directives: [TemplatePickerComponent, BindingComponent, NgClass],
    outputs: ['functionAdded']
})

export class FunctionNewComponent {

    elementRef: ElementRef;
    type: TemplatePickerType = TemplatePickerType.template;
    functionName: string;
    bc: BindingManager = new BindingManager();
    //bindings: FunctionBinding[] = [];
    model: BindingList = new BindingList();
    clickSave: boolean = false;
    updateBindingsCount = 0;
    private functionAdded: EventEmitter<FunctionInfo> = new EventEmitter<FunctionInfo>();


    constructor( @Inject(ElementRef) elementRef: ElementRef, private _functionsService: FunctionsService) {
        this.elementRef = elementRef;        
    }

    onTemplatePickUpComplete(templateName: string) {

        //var splitResult = templateName.split('_');
        //var type = BindingType[splitResult[0]];
        //var language = LanguageType[splitResult[1]];       

        this._functionsService.getTemplates().subscribe((templates) => {
            var functionTemplate: FunctionTemplate = templates.find((t) => t.name === templateName);
            
            //if (type) {
            //    functionTemplate = templates.find((t) => {
            //        if (t.language === language) {
            //            var find = t.bindings.find((b) => {
            //                return b.type === type;
            //            });
            //            return find ? true : false;
            //        }
            //        return false;
            //    });
            //} else {
            //    functionTemplate = templates.find((t) => {
            //        return (t.language === language) && (t.bindings.length === 0);
            //    });
            //}

            this.model.config = {
                schema: "",
                version: "",
                bindings: []
            };

            this._functionsService.getBindingConfig().subscribe((bindings) => {

                var binding = bindings.bindings.find((b) => b.type.toString().toLowerCase() === templateName.toLowerCase());
                this.model.config.bindings.push(this.bc.getDefaultBinding(binding.type, binding.direction, bindings.bindings));

                //functionTemplate.bindings.forEach((b) => {
                //    this.model.config.bindings.push(this.bc.getDefaultBinding(b.type, b.direction, bindings.bindings));
                //});
                
                this.model.setBindings();

            });
        });
    }

    onCreate() {        
        if (!this.functionName) {
            return;
        }
        this.updateBindingsCount = this.model.config.bindings.length;
        if (this.updateBindingsCount === 0) {
            this.createFunction();
            return;
        }

        this.clickSave = true;
    }

    onRemoveBinding(binding: UIFunctionBinding) {
        this.model.removeBinding(binding.id);
        this.model.setBindings();
    }

    onUpdateBinding(binding: UIFunctionBinding) {
        this.model.updateBinding(binding);
        this.updateBindingsCount--;

        if (this.updateBindingsCount === 0) {
            //Last binding update            
            this.createFunction();
        }
    }

    className() {
        return this.functionName ? 'col-md-3' : 'col-md-3 has-error';
    }

    private createFunction() {
        var scmUrl = this._functionsService.getScmUrl();
        var functionFolder = scmUrl + "/api/vfs/site/wwwroot/" + this.functionName;
        var dataFolder = scmUrl + "/api/vfs/data/functions";

        //https://functions728784f4.scm.azurewebsites.net/api/functions/test1
        var funcInfo =
            {
                name: this.functionName,
                config: this.bc.UIToFunctionConfig(this.model.config),
                //script_href: functionFolder + "/index.js",
                //config_href: functionFolder + "/function.js",
                //test_data_href: dataFolder + "/sampledata/" + this.functionName + ".dat",
                //secrets_file_href: dataFolder + "/secrets/" + this.functionName + ".json",
                script_href: "",
                config_href: "",
                test_data_href: "",
                secrets_file_href: "",

                href: this._functionsService.getScmUrl() + "/api/functions/" + this.functionName,

                clientOnly: false,
                template_id: null,
                isDeleted: false
            };
        
        this._functionsService.updateFunction(funcInfo)
            .subscribe(res => {
                this.functionAdded.emit(res);
            });
    }
}