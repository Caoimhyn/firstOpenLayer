// définition des variables globales
let map, data, controls;

/**
 * Author : Kpotard
 *
 * date : 22/01/2019
 *
 * openlayers 2 / GeoExt 1 / Ext-3.4.1
 *
 */
function init() {
    map = new OpenLayers.Map("map-id");

    // définition du fond de carte
    const wmsLayer = new OpenLayers.Layer.WMS("OpenLayers WMS",
        "http://vmap0.tiles.osgeo.org/wms/vmap0?", {layers: 'basic'});

    // définition de la couche vecteur data
    let data = new OpenLayers.Layer.Vector("Data", {
        styleMap: new OpenLayers.StyleMap({
            "default": new OpenLayers.Style({
                pointRadius: 6,
                fillColor: "green",
                strokeColor: '#000000',
                strokeWidth: 1
            })
        }),
        protocol: new OpenLayers.Protocol.HTTP({
            url: "data.json",
            format: new OpenLayers.Format.GeoJSON()
        }),
        strategies: [new OpenLayers.Strategy.Fixed()],
        isBasiclayer: false,
        displayInLayerSwitcher: true,
    });

    // ne marche plus mais permet en théorie de modifier les features dessinées
    let modifyControl = new OpenLayers.Control.ModifyFeature(data);
    modifyControl.mode |= OpenLayers.Control.ModifyFeature.RESIZE;
    map.addControl(modifyControl);
    modifyControl.activate();


    data.setOpacity(0.4);

    //Ajout de la pop up pour la couche 'data'
    let popup;

    //définition de la fonction de création de la pop-up
    function createPopup(feature) {
        // close existing popup
        if (popup) {
            popup.destroy();
        }
        popup = new GeoExt.Popup({
            title: feature.attributes.name,
            location: feature,
            width: 200,
            height: 130,
            html: "<br/> Nome du site : " + feature.attributes.name + "<br/> <br/> Informations : " + feature.attributes.infos + "<br/>",
            maximizable: true,
            collapsible: true,
            padding: '5 5 5 5'
            //items:items[0]
        });
        popup.show();
    }

    // relier la création de la pop up à l'evenement sur la couche data
    data.events.on({
        featureselected: function (e) {
            createPopup(e.feature);
        }
    });

    // Ajout des couches data et wmsLayer
    map.addLayers([wmsLayer, data]);

    // Fonction pour centrer la carte et définir un niveau de zoom. Ici 3.
    map.setCenter(new OpenLayers.LonLat(0, 0), 3);


    // définition de l'ensembles des contrôles que l'on souhaite permettre
    controls = {
        layerS : new OpenLayers.Control.LayerSwitcher(),
        mousePosi : new OpenLayers.Control.MousePosition(),
        scale : new OpenLayers.Control.Scale(),
        overView : new OpenLayers.Control.OverviewMap(),
        panZoom : new OpenLayers.Control.PanZoomBar(),
        point: new OpenLayers.Control.DrawFeature(data,
            OpenLayers.Handler.Point),
        line: new OpenLayers.Control.DrawFeature(data,
            OpenLayers.Handler.Path),
        polygon: new OpenLayers.Control.DrawFeature(data,
            OpenLayers.Handler.Polygon)
    };

    // association des controles à la carte
    for (let key in controls) {
        map.addControl(controls[key]);
    }

    // ajout du controle modifier les feature (not working)
    map.addControl(modifyControl);
    modifyControl.activate();

    // définition des actions qui seront incluses dans la toolbar de la carte
    // action pour permettre l'exploration de la couche carte
    const navAction = new GeoExt.Action({
        text: "Explorer",
        map: map,
        control: new OpenLayers.Control.Navigation(),
        toggleGroup: "editing",
        group: "draw",
        tooltip: "Naviguer dans la carte"
    });

    // Action qui permet de rajouter la possibilité de dessiner des points
    const drawPointAction = new GeoExt.Action({
        text: "Points",
        control: controls["point"],
        map: map,
        toggleGroup: "editing",
        allowDepress: false,
        group: "draw",
        tooltip: "Ajouter un point sur la carte"
    });

    // Action qui permet de rajouter la possibilité de dessiner des lignes
    const drawLineAction = new GeoExt.Action({
        text: "Lignes",
        control: controls["line"],
        map: map,
        toggleGroup: "editing",
        allowDepress: false,
        group: "draw",
        tooltip: "Dessiner une poly-ligne sur la carte"
    });

    // Action qui permet de rajouter la possibilité de dessiner des polygones
    const drawPolygonAction = new GeoExt.Action({
        text: "Polygones",
        control: controls["polygon"],
        map: map,
        toggleGroup: "editing",
        group: "draw",
        allowDepress: false,
        tooltip: "Dessiner un polygone sur la carte"
    });


    // Permet de définir le format de la date
    function formatDate(value) {
        return value ? value.dateFormat('d M Y') : '';
    }

    // raccourcis
    const fm = Ext.form;

    // the column model has information about grid columns
    // dataIndex maps the column to the specific data field in
    // the data store (created below)
    const cm = new Ext.grid.ColumnModel({
        // specify any defaults for each column
        defaults: {
            sortable: true // Attention les colonne ne sont pas triable par défaut
        },
        columns: [{
            id: 'name',
            header: 'Nom du site',
            dataIndex: 'name', // correspond au champs de propriétes dans data.json
            width: 180,
            editor: new fm.TextField({
                allowBlank: false
            })
        }, {
            id: 'elevation',   // permet de l'identifier pour des actions ailleurs dans le script (voir plus bas)
            header: 'Altitude',
            dataIndex: 'elevation', // correspond au champs de propriétes dans data.json
            width: 90,
            editor: new fm.NumberField({
                allowBlank: false,
                allowNegative: true
            })
        },
            {
                header: 'Light',
                dataIndex: 'light',  // correspond au champs de propriétes dans data.json
                width: 130,
                editor: new fm.ComboBox({
                    typeAhead: true,
                    triggerAction: 'all',
                    // // transform the data already specified in html
                    transform: 'light',
                    lazyRender: true,
                    listClass: 'x-combo-list-small'
                })
            },
            {
                header: 'Price',
                dataIndex: 'price', // correspond au champs de propriétes dans data.json
                width: 70,
                align: 'right',
                renderer: 'usMoney',
                editor: new fm.NumberField({
                    allowBlank: true,
                    allowNegative: false,
                    maxValue: 100000
                })
            },
            {
                header: 'Date d\'ajout',
                dataIndex: 'availDate', // correspond au champs de propriétes dans data.json
                width: 95,
                renderer: formatDate,
                editor: new fm.DateField({
                    format: 'm/d/y',
                    minValue: '01/01/06',
                    disabledDays: [0, 6],
                    disabledDaysText: 'Plants are not available on the weekends'
                })
            }
            , {
                xtype: 'checkcolumn',
                header: 'Sensible?',
                dataIndex: 'sensible', // correspond au champs de propriétes dans data.json
                width: 75

            },
            {
                id: 'infos',
                header: 'Informations',
                dataIndex: 'infos', // correspond au champs de propriétes dans data.json
                width: 950,
                editor: new fm.TextField({
                    allowBlank: false
                })
            }
        ]
    });

    // Création du store qui contiendra les données propriéts ecrites dans le fichier data.json
    // ici le store est également liée au layer data (ce qui permet de liée les selection entre le store et la couche vecteur)
    store = new GeoExt.data.FeatureStore({
        layer: data,
        fields: [
            {name: 'name', type: 'string'},
            {name: 'elevation', type: 'float'},
            {name: 'light', type: 'string'},
            {name: 'price', type: 'float'},
            // dates can be automatically converted by specifying dateFormat
            {name: 'availDate', mapping: 'availability', type: 'date', dateFormat: 'm/d/Y'},
            {name: 'sensible', type: 'boolean'},
            {name: 'infos', type: 'string'}
        ],
        proxy: new GeoExt.data.ProtocolProxy({
            protocol: new OpenLayers.Protocol.HTTP({
                url: "data.json",
                format: new OpenLayers.Format.GeoJSON()
            })
        })
    });

    // création du panel qui permeet d'afficher le store et de la rendre modifiable avec les attributs CM et SM
    const gridPanel = new Ext.grid.EditorGridPanel({
        title: "Feature Grid",
        renderTo: 'editor-grid',
        autoExpandColumn: 'infos',
        collapsible: true,
        collapseMode: "mini",
        store: store,
        cm: cm,
        width: 1915,
        height: 200,
        sm: new GeoExt.grid.FeatureSelectionModel({
            selectControl: modifyControl.selectControl,
            singleSelect: true
        })
    });

    // définition de composant qui encaspule le composant carte crée précédement
    const mapPanel = new GeoExt.MapPanel({
        renderTo: 'gxmap',
        height: '100%',
        width: '100%',
        // association de la map précédement créée
        map: map,
        title: 'Carte',
        center: [1.49, 46, 73],
        zoom: 6,
        // asoocition des actions dans la toolbar
        tbar:
            [navAction, {                   // <-- Add the action directly to a toolbar
                text: 'Edition',
                menu: new Ext.menu.Menu({
                    items: [
                        new Ext.menu.CheckItem(navAction),
                        new Ext.menu.CheckItem(drawPointAction),
                        new Ext.menu.CheckItem(drawLineAction),
                        new Ext.menu.CheckItem(drawPolygonAction),]
                })        // <-- Add the action directly to a menu
            }]
    });

    const layerList = new GeoExt.tree.LayerContainer({
        text: 'Fonds de carte',
        layerStore: mapPanel.layers,
        height: '100%',
        width: '100%',
        leaf: false,
        expanded: true
    });

    const layerTree = new Ext.tree.TreePanel({
        title: 'Gestion des couches cartographiques',
        renderTo: 'layerTree',
        root: layerList,
        height: '100%',
        collapsible: true
    });
}
