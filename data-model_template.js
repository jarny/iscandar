<%
import json
%>

"use strict";
define(function(require, exports, module) {
    module.exports = {
		metadata: ${json.dumps(metadata) | n},	// {'name':'pera', ...}
		pca: ${json.dumps(pca) |n},	// 2xN or 3xN, [[3.21, 1.22, ...],...]
		tsne: ${json.dumps(tsne) |n},	// 2xN or 3xN, [[3.21, 1.22, ...],...]
		analysisMetadata: ${json.dumps(analysisMetadata) |n},	// {'Notes': 'log2(cpm+1) was used',...}
		sampleIds: ${json.dumps(sampleIds) |n},	// ['sample1','sample2',...]
	
		sampleGroups: ${json.dumps(sampleGroups) |n},	// ['celltype','cell_lineage',...]
		sampleGroupItems: ${json.dumps(sampleGroupItems) |n},	// {'celltype':['B','T',...], ...}
		sampleGroupColours: ${json.dumps(sampleGroupColours) |n},	// {'celltype':{'B':'#efefef',...}, ...}
		sampleIdsAsGroupItems: ${json.dumps(sampleIdsAsGroupItems) |n},	// {'celltype':['T','T','B',...],...}
	
		clusters: ${json.dumps(clusters) |n},	// ['tsne p=20','tsne p=30',...]
		clusterItems: ${json.dumps(clusterItems) |n},	// {'tsne p=20':['cluster01','cluster02',...]}
		clusterColours: ${json.dumps(clusterColours) |n},	// {'tsne p=20':{'cluster01':'#efefef',...},...}
		sampleIdsAsClusterItems: ${json.dumps(sampleIdsAsClusterItems) |n},	// {'tsne p=20':['cluster03','cluster01',...],...}
	
		genesets: ${json.dumps(genesets) |n},	// [{'name':'High EryP', 'genes':['gene1','gene2',...]},...]
		genesetExpressionValues: ${json.dumps(genesetExpressionValues) |n},	// {'High EryP':[3.01, 4.2,...],...}
		geneExpressionValues: ${json.dumps(geneExpressionValues) |n},	// {'gene1':[0, 2.31, ...], ...}
    };
});
