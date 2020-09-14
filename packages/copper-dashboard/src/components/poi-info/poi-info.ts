import Component from 'vue-class-component';
import { WidgetBase } from '@csnext/cs-client';
// import { C2 } from '../../datasources/c2';
import './poi-info.css';

import { Feature, Point } from 'geojson';
import { GeojsonPlusLayer } from '@csnext/cs-map';
import { FeatureType, InfoTemplate } from '@csnext/cs-data';
import Vue, { VNode } from 'vue';


@Component({    
    template: require('./poi-info.html')
    // renderError: (h, err) => {
    //     return h('pre', { style: { color: 'red' }}, err.stack)
    // }
})
export class PoiInfo extends WidgetBase {

    public editing: boolean = false;

    public get layer(): GeojsonPlusLayer | undefined {
        return this.widget.data.layer;
    }

    public get featureType() : FeatureType | undefined {
        const ft = this.feature?.properties?.type;
        if (ft && this.layer?.featureTypes?.hasOwnProperty(ft)) {
            return this.layer.featureTypes[ft];            
        }
    }

    public get infoTemplate() : InfoTemplate | undefined {
        return this.featureType?.infoTemplate;
    }

    private getInfoTemplate() {
        var vm = {            
            template: `<span>${this.infoTemplate?.small}</span>`,
            data: ()=> { return this.feature?.properties }
        };
        return vm;        
    }

    public get feature(): Feature<Point> | undefined {
        return this.widget.data.feature;
    }


    beforeMount() {
        if (this.widget.data.editing) {
            this.editing = true;
        }

        if (this.widget.data.feature.properties.title === 'new poi') {
            this.editing = true;
        }

        console.log(this.feature);

        
    }

  
    zoomTo() {
        // if (this.c2 && this.c2.map) {
        //     this.c2.map.zoomFeature(this.widget.data.feature, 18);
        // }
    }


}
