

"use strict";
define(function(require, exports, module) {
    module.exports = {
		metadata: {"QC notes": "Describe any notes about QC, eg: scater package from R was used to filter out outlier samples.", "read mapping summary": "Describe how the reads are mapped, eg: Reads were aligned using subread package in R.", "name": "example", "description": "Describe the dataset here, giving a quick summary of what it is about. Could be the user supplied description when requesting a dataset in stemformatics. Only name is the compulsory field in this table."},	// {'name':'pera', ...}
		pca: [[-17.4922639851956, -20.5901934462943, -10.025559087054699, -5.11612248134397], [-4.7678901429005895, 9.31414038330277, -5.127148349041139, 0.128077346081517]],	// 2xN or 3xN, [[3.21, 1.22, ...],...]
		tsne: [[6.31230331265374, 6.07267975641383, 2.81072892076918, 7.091791699714889], [0.39279931560814, 0.491611187837764, -2.76195663851212, 0.44233311817655896]],	// 2xN or 3xN, [[3.21, 1.22, ...],...]
		analysisMetadata: {"genes included": "Describe which genes have been included in this report for showing expression.", "PCA_function": "Describe some details of the function used, including references. eg: (python) <a href='http://scikit-learn.org/stable/modules/generated/sklearn.decomposition.PCA.html'>sklearn PCA</a>", "TSNE_function": "Same as PCA_function. eg: (R) <a href='https://cran.r-project.org/web/packages/Rtsne/index.html'>Rtsne</a>", "TSNE_parameters": "Describe some details of the parameters used for TSNE. eg: perplexity=20 (roughly the number of neighbours for each point),<br/> n_iter=1000 (number of iterations),<br/> ", "Notes": "Other general notes useful for the user. eg: log2(cpm+1) was used before performing PCA and TSNE, where cpm is the counts per million expression matrix.", "gene sets": "Describe where the gene sets included come from. eg: These gene sets are DE genes between WT vs Mut."},	// {'Notes': 'log2(cpm+1) was used',...}
		sampleIds: ["s1", "s2", "s3", "s4"],	// ['sample1','sample2',...]
	
		sampleGroups: ["celltype"],	// ['celltype','cell_lineage',...]
		sampleGroupItems: {"celltype": ["B", "T"]},	// {'celltype':['B','T',...], ...}
		sampleGroupColours: {"celltype": {"B": "#d7191c", "T": "#4dac26"}},	// {'celltype':{'B':'#efefef',...}, ...}
		sampleIdsAsGroupItems: {"celltype": ["B", "T", "B", "T"]},	// {'celltype':['T','T','B',...],...}
	
		clusters: ["cell_cycle"],	// ['tsne p=20','tsne p=30',...]
		clusterItems: {"cell_cycle": ["G1", "G2M", "S"]},	// {'tsne p=20':['cluster01','cluster02',...]}
		clusterColours: {"cell_cycle": {"S": "#7570b3", "G2M": "#d95f02", "G1": "#1b9e77"}},	// {'tsne p=20':{'cluster01':'#efefef',...},...}
		sampleIdsAsClusterItems: {"cell_cycle": ["S", "G2M", "G1", "S"]},	// {'tsne p=20':['cluster03','cluster01',...],...}
	
		genesets: [{"name": "gene_set_1", "genes": ["gene1", "gene3"]}],	// [{'name':'High EryP', 'genes':['gene1','gene2',...]},...]
		genesetExpressionValues: {"gene_set_1": [2.693112, 5.02020142226141, 2.843676, 4.35385260623762]},	// {'High EryP':[3.01, 4.2,...],...}
		geneExpressionValues: {"gene3": [0.6771343944640239, 0.0, 2.926570464097129, 0.0], "gene2": [1.76376951420201, 2.76418653711792, 4.1963629662962205, 0.8840457486405731], "gene1": [4.7090890754506205, 5.02020142226141, 2.7607814581582497, 4.35385260623762]},	// {'gene1':[0, 2.31, ...], ...}
    };
});
