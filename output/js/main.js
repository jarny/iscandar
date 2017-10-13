"use strict";

require.config({
    baseUrl: 'js',
    paths: {
        d3:     'd3.v3.min',
        vue:	'vue.min',
        plotly: 'plotly-latest.min',
        data:	'data-model',
    },
});

define(['d3', 'vue.min', 'plotly-latest.min', 'data-model'], function(d3, Vue, Plotly, DataModel) {

	// -----------------------------------------------------------------------------------
	// Extend data model by adding functions
	// -----------------------------------------------------------------------------------
	var dataModel = DataModel;
	dataModel.metadata['number of samples'] = dataModel.pca[0].length;
	dataModel.metadata['report creation date'] = (new Date()).toISOString().split("T")[0];
	
	// Assign methods to dataModel, including working out traces for plotly, which depends on the data.
	dataModel.addCluster = function(clusterName, clusterItems, clusterItemFromSampleId) {
		if (this.clusters.indexOf(clusterName)==-1) {
			this.clusters.push(clusterName);
			this.clusterItems[clusterName] = clusterItems;
			// also update sampleIdsAsClusterItems
			this.sampleIdsAsClusterItems[clusterName] = this.sampleIds.map(function(item) { return clusterItemFromSampleId[item]; });
		}
	};
	
	dataModel.getTraces = function(params) {
		var self = this;
		var plotBy = params['plotBy'];
		var selectedSampleGroup = params['selectedSampleGroup'];
		var selectedCluster = params['selectedCluster'];
		var selectedGene = params['selectedGene'];
		var selectedGeneset = params['selectedGeneset'];
		var coords = params['coords'];

		// Work out traces - also add sampleIds, which isn't used directly by plotly but we need it for lasso function
		var traces = [];
		if (plotBy=='sample group') {	// trace by selected sample group
			for (var i=0; i<self.sampleGroupItems[selectedSampleGroup].length; i++) {
				var groupItem = self.sampleGroupItems[selectedSampleGroup][i];
				var sampleIds = self.sampleIds.filter(function(item,index) { return self.sampleIdsAsGroupItems[selectedSampleGroup][index]==groupItem });
				var trace = {
					x: coords[0].filter(function(item,index) { return self.sampleIdsAsGroupItems[selectedSampleGroup][index]==groupItem }),
					y: coords[1].filter(function(item,index) { return self.sampleIdsAsGroupItems[selectedSampleGroup][index]==groupItem }),
					text: sampleIds,
					name: groupItem,
					marker: {},
					sampleIds: sampleIds,
				};
				if (selectedSampleGroup in self.sampleGroupColours && groupItem in self.sampleGroupColours[selectedSampleGroup])
					trace.marker.color = self.sampleGroupColours[selectedSampleGroup][groupItem];
				traces.push(trace);
			}
		} else if (plotBy=='cluster') {	// trace by clusters
			for (var i=0; i<self.clusterItems[selectedCluster].length; i++) {
				var clusterItem = self.clusterItems[selectedCluster][i];
				var sampleIds = self.sampleIds.filter(function(item,index) { return self.sampleIdsAsClusterItems[selectedCluster][index]==clusterItem });
				var trace = {
					x: coords[0].filter(function(item,index) { return self.sampleIdsAsClusterItems[selectedCluster][index]==clusterItem }),
					y: coords[1].filter(function(item,index) { return self.sampleIdsAsClusterItems[selectedCluster][index]==clusterItem }),
					text: sampleIds,
					name: clusterItem,
					marker: {},
					sampleIds: sampleIds,
				};
				if (selectedCluster in self.clusterColours && clusterItem in self.clusterColours[selectedCluster])
					trace.marker.color = self.clusterColours[selectedCluster][clusterItem];
				traces.push(trace);
			}
		}
		else if (plotBy=='gene expression' || plotBy=='gene set expression') {
			if (plotBy=='gene expression' && selectedGene in self.geneExpressionValues || plotBy=='gene set expression') {
				var expressionValues = plotBy=='gene expression'? self.geneExpressionValues[selectedGene] : self.genesetExpressionValues[selectedGeneset];
				var name = plotBy=='gene expression'? selectedGene : selectedGeneset;
				var trace = {
					x: coords[0],
					y: coords[1],
					text: self.sampleIds.map(function(sampleId,index) { return sampleId + "(" + expressionValues[index] + ")"; }),
					name: name,
					marker:{'color':expressionValues,
							'colorbar':{ title: name },
							},
					sampleIds: self.sampleIds,
				};	
				traces.push(trace);
			}
		}
		
		// Add common elements to all traces
		for (var i=0; i<traces.length; i++) {			
			traces[i].type = 'scatter';
			traces[i].hover = "text";
			if (!('size' in traces[i].marker))
				traces[i].marker.size = 6;
			if (!('mode' in traces[i].marker)) {
				traces[i].marker.symbol = 'circle';
				traces[i].mode = 'markers';
			}
		}
		return traces;
	};
		
	// -----------------------------------------------------------------------------------
	// Function to return an array of arrays comprising of matching or notMatching values. 
	// The returned array is in the same structure as traces, where each outer array corresponds to a trace 
	// and each inner array corresponds to samples in that trace.
	// selectedSampleIds is used to determine which of matching or notMatching value should be substituted for each sample.
	//
	// Example (note that each trace element must have 'sampleId' key - other keys are ignored)
	// 	  var traces = [[{sampleId:'s3'},{sampleId:'s2'},{sampleId:'s4'}],[{sampleId:'s1'},{sampleId:'s5'}]];
	//    dataModel.traceUpdateArray(traces, ['s1','s2','s5'], 'red', 'blue')
	// 	  > [['blue','red','blue'],['red','red']]
	// -----------------------------------------------------------------------------------
	var traceUpdateArray = function(traces, selectedSampleIds, matching, notMatching) {
		return traces.map(function(trace) { 
			return trace.sampleIds.map(function(sampleId) { return selectedSampleIds.indexOf(sampleId)!=-1? matching : notMatching }); 
		});
	};
	
	// zfill(1,2) returns "01"
	var zfill = function(number, size){ return ('000000000' + number).substr(-size); }
	
	// -----------------------------------------------------------------------------------
	// Define settings model, which handles persistent user settings via localStorage
	// -----------------------------------------------------------------------------------
	var settings = {
		keys: ['pointSize'],
		defaults: [5]
	};
	
	settings.defaultValue = function(key) {
		var index = this.keys.indexOf(key);
		return index==-1? null : this.defaults[index];
	}
	
	// method for getting a setting
	settings.getValue = function(key) {
		var stored = localStorage.getItem('IscandarSettings_' + key);
		return stored==null? this.defaultValue(key) : stored;
	}
	
	// method for updating a setting
	settings.saveValue = function(key, value) {
		localStorage.setItem('IscandarSettings_' + key, value);
	}
		
	// -----------------------------------------------------------------------------------
	// Vue component to handle lasso dialog
	// -----------------------------------------------------------------------------------
	Vue.component('lassoDialog', {
		template: "#lasso-dialog",
		props: ['show','clusterName','selectedSampleIds'],
		methods: {
			close: function () {
				this.$emit('close');
			},
			saveCluster: function() {
				this.$emit('save-cluster', this.clusterName, this.selectedSampleIds);
			}
		},
	});

	// -----------------------------------------------------------------------------------
	// Vue component to handle about tab
	// -----------------------------------------------------------------------------------
	Vue.component('about-tab', {
		data: function() {
			return {
				selectedOption: "dataset",
				metadata: dataModel.metadata,
				analysisMetadata: dataModel.analysisMetadata,
				genes: Object.keys(dataModel.geneExpressionValues),
			};
		},
		computed: {
			genesToShow: function() {
				this.genes.sort();
				return this.genes.join('\n')
			}
		}
	});
	
	// -----------------------------------------------------------------------------------
	// Vue component to handle pca/tsne tab
	// -----------------------------------------------------------------------------------
	Vue.component('pca-tab', {
		data: function() {
			return {
				plotTypes: ['pca','tsne','pca vs tsne'],
				selectedPlotType: 'pca',
				coordFromPlotType: {'pca': [dataModel.pca], 'tsne': [dataModel.tsne], 'pca vs tsne':[dataModel.pca, dataModel.tsne]},
				divIdFromPlotType: {'pca':['pcaPlotDiv'], 'tsne':['pcaPlotDiv'], 'pca vs tsne':['pvtPlotPcaDiv','pvtPlotTsneDiv']},
				plotByOptions: ['sample group', 'cluster', 'gene expression', 'gene set expression'],	// 
				selectedPlotByOption: 'sample group',
				selectedGene: '',
				genesets: dataModel.genesets,
				selectedGeneset: dataModel.genesets[0].name,
				sampleGroups: dataModel.sampleGroups,
				selectedSampleGroup: dataModel.sampleGroups[0],	// default sampleGroup, eg 'celltype'
				//clusters: dataModel.clusters,
				selectedCluster: dataModel.clusters[0],
				selectedPoints: [],
				addToSelection: false,
			};
		},
		computed: {
			selectedSampleIds: function() {	// pass this to lasso dialog, so that it can send it as a part of its event argument
				return this.selectedPoints.map(function(item) { return item.sampleId; });
			}
		},
		methods: {
			plot : function() {
				var self = this;
				
				if (self.selectedPlotByOption=='gene expression') {
					if (self.selectedGene=='')
						return;
					else if (!(self.selectedGene in dataModel.geneExpressionValues)) {
						alert("No expression values available for this gene: " + self.selectedGene + 
						". Have a look at About tab for a full list of genes with available expression values.");
						return;
					}
				}
								
				// coords depends on plotType
				for (var i=0; i<self.coordFromPlotType[self.selectedPlotType].length; i++) {								
					var traces = dataModel.getTraces({'plotBy':self.selectedPlotByOption, 
													  'selectedSampleGroup':self.selectedSampleGroup,
													  'selectedCluster':self.selectedCluster,
													  'selectedGene':self.selectedGene,
													  'selectedGeneset':self.selectedGeneset,
													  'coords':self.coordFromPlotType[self.selectedPlotType][i]});

					var divId = self.divIdFromPlotType[self.selectedPlotType][i];
					
					// Note that passing the element div as the first argument of newPlot doesn't seem to work.
					// Always pass on the string which is the name of the div.
					Plotly.newPlot(divId, traces, { title: self.selectedPlotType, dragmode: "lasso" });
					
					// Also track lasso selection event and store which points are selected. This function runs when the user lets go of the 
					// mouse after lasso operation.
					// Note that for multiple traces, use point.curveNumber to work out the correct point for pointNumber.
					var div = document.getElementById(divId);  // div.on() below doesn't like d3.select() object								
					div.on('plotly_selected', function(eventData) {
						if (!self.addToSelection) self.selectedPoints = [];
						
						eventData.points.forEach(function(point) {
							var sampleId = traces[point.curveNumber].sampleIds[point.pointNumber];
							if (self.selectedSampleIds.indexOf(sampleId)==-1)
								self.selectedPoints.push({'sampleId':sampleId, 'x':point.x, 'y':point.y});							
						});
						
						// Restyle selectedSampleIds differently to the others. We have to loop through self.divIdFromPlotType
						// because pca vs tsne has two plots we have to restyle. To restyle individual points within traces,
						// you have to supply a nested array. eg. [['red','blue','red'],['black','black']] would be for 2 traces with
						// 3 and 2 points in each trace respectively. 
						var selectedSampleIds = self.selectedPoints.map(function(item) { return item.sampleId; });		
						for (var j=0; j<self.divIdFromPlotType[self.selectedPlotType].length; j++) {
							var targetDiv = document.getElementById(self.divIdFromPlotType[self.selectedPlotType][j]);
							Plotly.restyle(targetDiv, {'marker.symbol': traceUpdateArray(traces, selectedSampleIds, 'diamond', 'circle'), 
													   'marker.opacity': traceUpdateArray(traces, selectedSampleIds, 1, 0.2)} );
						}
					});
				}
			},
		},
		mounted() {
			this.plot();
		}
	});
	
	// -----------------------------------------------------------------------------------
	// Vue component to handle gene vs gene tab
	// -----------------------------------------------------------------------------------
	Vue.component('gvg-tab', {
		data: function() {
			return {
				divId: "gvgPlotDiv",	// need this for plotly functions
				genesets: dataModel.genesets,
				axes: ['x-axis', 'y-axis'],
				options: ['gene', 'gene set'],
				selectedOption: ['gene','gene'],	// 1st element=x-axis, 2nd for y
				selectedGene: ['',''],
				selectedGeneset: [dataModel.genesets[0].name,dataModel.genesets[0].name],
				plotByOptions: ['sample group', 'cluster'],
				selectedPlotByOption: 'sample group',
				sampleGroups: dataModel.sampleGroups,
				selectedSampleGroup: dataModel.sampleGroups[0],	// default sampleGroup, eg 'celltype'
				selectedCluster: dataModel.clusters[0],
				selectedPoints: [],
				addToSelection: false,
			};
		},
		computed: {
			selectedSampleIds: function() {	// pass this to lasso dialog, so that it can send it as a part of its event argument
				return this.selectedPoints.map(function(item) { return item.sampleId; });
			}
		},
		methods: {
			plot : function() {
				var self = this;
				var titleValues = [];	// use this to construct the plot title
				
				// Work out array of values for each axis
				var eValues = [];	// eg. [[2.3,4.2,...], [0,1.2,...]]
				for (var i=0; i<self.axes.length; i++) {	// loop through each axis
					if (self.selectedOption[i]=='gene')	{	// fetch expression values for the gene
						if (self.selectedGene[i]=='')	// no gene entered - just ignore it
							return;
						else if (!(self.selectedGene[i] in dataModel.geneExpressionValues)) {
							alert("No expression values available for this gene: " + self.selectedGene[i]);
							return;
						}
						eValues.push(dataModel.geneExpressionValues[self.selectedGene[i]]);
						titleValues.push(self.selectedGene[i]);
					} else {	// fetch expression values for the gene set
						eValues.push(dataModel.genesetExpressionValues[self.selectedGeneset[i]]);
						titleValues.push(self.selectedGeneset[i]);
					}
				}
				var traces = dataModel.getTraces({'plotBy':self.selectedPlotByOption, 
												  'selectedSampleGroup':self.selectedSampleGroup,
												  'selectedCluster':self.selectedCluster,
												  'coords':eValues});
												  
				Plotly.newPlot(this.divId, traces, { title: titleValues.join(" vs "), dragmode: "lasso" });
				var div = document.getElementById(this.divId);
				div.on('plotly_selected', function(eventData) {
					if (!self.addToSelection) self.selectedPoints = [];
					
					eventData.points.forEach(function(point) {
						var sampleId = traces[point.curveNumber].sampleIds[point.pointNumber];
						if (self.selectedSampleIds.indexOf(sampleId)==-1)
							self.selectedPoints.push({'sampleId':sampleId, 'x':point.x, 'y':point.y});
					});
					
					// Restyle selectedSampleIds differently to the others. To restyle individual points within traces,
					// you have to supply a nested array. eg. [['red','blue','red'],['black','black']] would be for 2 traces with
					// 3 and 2 points in each trace respectively. 
					var selectedSampleIds = self.selectedPoints.map(function(item) { return item.sampleId; });		
					Plotly.restyle(div, {'marker.symbol': traceUpdateArray(traces, selectedSampleIds, 'diamond-open', 'circle'), 
										 'marker.opacity': traceUpdateArray(traces, selectedSampleIds, 1, 0.2)} );
				});
			},
		},
	});
	
	// -----------------------------------------------------------------------------------
	// Vue component to handle manage tab
	// -----------------------------------------------------------------------------------
	Vue.component('manage-tab', {
		data: function() {
			return {
				selectedOption: "manage",
				genesets: dataModel.genesets,
				selectedGeneset: dataModel.genesets[0].name,
				clusters: dataModel.clusters,
				selectedCluster: dataModel.clusters[0],
				showExportDialog: false,
				exportType: '',
			};
		},
		computed: {
			exportValue: function() {
				var self = this;
				if (self.exportType=='geneset') {
					var geneset = dataModel.genesets.filter(function(item) { return item.name==self.selectedGeneset; })[0];
					return {title: 'genes in ' + self.selectedGeneset, content: geneset.genes.join('\n')};
				} else if (self.exportType=='cluster') {
					// parse sampleIdsAsClusterItems
					var lines = [];
					for (var i=0; i<dataModel.clusterItems[self.selectedCluster].length; i++) {
						var sampleIds = dataModel.sampleIds.filter(function(sampleId,index) { 
							return dataModel.sampleIdsAsClusterItems[self.selectedCluster][index]==dataModel.clusterItems[self.selectedCluster][i]; 
						});
						lines.push(dataModel.clusterItems[self.selectedCluster][i] + '\t' + sampleIds.join(','));
					}
					return {title: 'samples in ' + self.selectedCluster, content: lines.join('\n')};
				} else
					return {title:'', content:''};
			}
		}
	});
	
	// -----------------------------------------------------------------------------------
	// Main Vue instance
	// -----------------------------------------------------------------------------------
	new Vue({
		el: "#wrapperDiv",
		data: {
			tabs: ['About', 'PCA/TSNE', 'Gene vs Gene', 'Manage'],
			selectedTab: 'PCA/TSNE',	// default tab to start with
						
			dataset: dataModel.metadata.name,	// name of the dataset, eg. 'pera'
			clusters: dataModel.clusters,
			
			settings: { 
				defaults: {'pointSize': settings.defaultValue('pointSize')},
				pointSize: settings.getValue('pointSize') 
			},
			version_number: '0.1.1',
			loading:true,
			showLassoDialog: false,
			
			helpDialog: {'show':false,
						 'top': 1000,
						 'left':1000,
						 'content':'',
						},
			helpText: {'settings':"You can control some of the settings here. Clicking the save button will ensure that changes persist through sessions (per browser). " +
								  "If you don't save, you can still see the changes - they just won't be saved across sessions. " +
								  "Note that changes won't be visible until some change is made on a page,	such as changing the plot by view. " +
								  "The default value is shown in the brackets.",
						'lasso':"You can use the lasso tool to select points, and 'add' option can be toggled to add to the current selection. " +
								"Use 'save' to save the selection as a new cluster. Otherwise when the plot changes, the selection will be reset.",
						'view':"Use these selections to re-draw the plot. Note that changing view will render the last view used, " +
							   "so plotting by gene expression will show the expression of last gene shown, for example.",
						'expression':"Expression values of a gene can be shown as a colour scale here, or the mean expression value for a gene set " +
									"can be shown. Not all genes are shown - see About page for a full list of genes whose expression values have "+
									"been included in this report."},
	
		},
		methods: {
														
			updateSettings: function()
			{
				settings.saveValue('pointSize', this.settings.pointSize);
			},
			
			runLasso: function(datatype)
			{		
				this.config[datatype].selectedView = 'lasso';
				this.redraw(datatype);
			},
			
			showHelpDialog: function(contentType, event)
			{
				this.helpDialog.content = (contentType in this.helpText)? this.helpText[contentType] : contentType;
				this.helpDialog.show = true;
				this.helpDialog.top = event.pageY + 5;
				this.helpDialog.left = event.pageX + 5;
			},
			
			saveCluster: function(clusterName, selectedSampleIds)
			{
				if (dataModel.clusters.indexOf(clusterName)!=-1) {
					alert("Another cluster with this name already exists.");
					return;
				} else if (selectedSampleIds.length==0) {
					alert("You need to select some points first.");
					return;
				}
				
				// Add this cluster to dataModel's list of clusters. Cluster items will just be "cluster01" and "cluster02",
				// where cluster01 is the group of selected samples and cluster02 is the other group.
				var clusterItems = ["cluster01", "cluster02"];
				var clusterItemFromSampleId = {};
				for (var i=0; i<dataModel.sampleIds.length; i++)
					clusterItemFromSampleId[dataModel.sampleIds[i]] = selectedSampleIds.indexOf(dataModel.sampleIds[i])==-1? "cluster02" : "cluster01";
				dataModel.addCluster(clusterName, clusterItems, clusterItemFromSampleId);
				this.showLassoDialog = false;
			}
		},
		mounted() {	// vue runs this after load
			this.loading = false;
		}
	});
		
});

