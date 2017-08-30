"""
Script to create output/js/data-model.js file, using data-model_template.js file as mako template.

Usage (if all input files are ready to go  in input/ directory):
	> python create_data_model.py
	
If using from within a python script to create the input variables directly:
	> from create_data_model import DataModel
	> dm = DataModel()
	> dm.metadata = {'name':'pera', ...}
	> dm.saveJSFile()
"""

import os, pandas
from mako.template import Template

class DataModel(object):
	"""See input directory and dataModelFromInputFiles() function below for examples of data required to be attached to DataModel object.
	"""
	
	def saveJSFile(self, templateFile="data-model_template.js", outfile="output/js/data-model.js"):
		# overwrite data-model.js by injecting variables
		params = {'metadata':self.metadata, 
				  'pca':self.pca.T.values.tolist(), 
				  'tsne':self.tsne.T.values.tolist(),
				  'analysisMetadata':self.analysisMetadata,
		  
				  'sampleIds':self.sampleIds,
				  'sampleGroups':self.sampleGroups,
				  'sampleGroupItems':self.sampleGroupItems,
				  'sampleGroupColours':self.sampleGroupColours,
				  'sampleIdsAsGroupItems':self.sampleIdsAsGroupItems,
		  
				  'clusters':self.clusters,
				  'clusterItems':self.clusterItems,
				  'clusterColours':self.clusterColours,
				  'sampleIdsAsClusterItems':self.sampleIdsAsClusterItems,
		  
				  'genesets':self.genesets,
				  'genesetExpressionValues':self.genesetExpressionValues,
				  'geneExpressionValues':self.geneExpressionValues,
				 }
		template = Template(filename=templateFile)
		open(outfile,'w').write(template.render(**params))
    
def dataModelFromInputFiles(inputDir="input"):
	"""Instantiate a DataModel instance and assign all required attributes by reading the files in input directory.
	Returns the instance.
	"""
	dm = DataModel()
	
	dm.metadata = pandas.read_csv(os.path.join(inputDir, "metadata.txt"), sep="\t", index_col=0, header=None).to_dict()[1]
	dm.pca = pandas.read_csv(os.path.join(inputDir, "pca.txt"), sep="\t", index_col=0)
	dm.tsne = pandas.read_csv(os.path.join(inputDir, "tsne.txt"), sep="\t", index_col=0)
	dm.analysisMetadata = pandas.read_csv(os.path.join(inputDir, "analysisMetadata.txt"), sep="\t", index_col=0, header=None).to_dict()[1]
	
	# process sample info
	dm.sampleIds = dm.pca.index.tolist()
	samples = pandas.read_csv(os.path.join(inputDir, "samples.txt"), sep="\t", index_col=0).loc[dm.sampleIds]
	sampleGroupItems = pandas.read_csv(os.path.join(inputDir, "sampleGroupItems.txt"), sep="\t", index_col=0)
	
	dm.sampleGroups = sampleGroupItems.index.tolist()
	dm.sampleGroupItems = dict([(index, row[0].split(',')) for index,row in sampleGroupItems.iterrows()])
	dm.sampleGroupColours = dict([(index, dict(zip(row[0].split(','), row[1].split(',')))) for index,row in sampleGroupItems.iterrows()])
	dm.sampleIdsAsGroupItems = dict([(item, [samples.at[sampleId, item] for sampleId in dm.sampleIds]) for item in dm.sampleGroups])
    
    # process cluster info
	clusters = pandas.read_csv(os.path.join(inputDir, "clusters.txt"), sep="\t", index_col=0).loc[dm.sampleIds]
	clusterItems = pandas.read_csv(os.path.join(inputDir, "clusterItems.txt"), sep="\t", index_col=0)
	
	dm.clusters = clusterItems.index.tolist()
	dm.clusterItems = dict([(index, row[0].split(',')) for index,row in clusterItems.iterrows()])
	dm.clusterColours = dict([(index, dict(zip(row[0].split(','), row[1].split(',')))) for index,row in clusterItems.iterrows()])
	dm.sampleIdsAsClusterItems = dict([(item, [clusters.at[sampleId, item] for sampleId in dm.sampleIds]) for item in dm.clusters])
	
	# process genesets
	genesets = pandas.read_csv(os.path.join(inputDir, "genesets.txt"), sep="\t", index_col=0)
	dm.genesets = [{'name':index, 'genes':row['genes'].split(',')} for index,row in genesets.iterrows()]
	dm.genesetExpressionValues = dict([(index, list(map(float, row['meanExpression'].split(',')))) for index,row in genesets.iterrows()])
	
	# gene expression values
	expression = pandas.read_csv(os.path.join(inputDir, "expression.txt"), sep="\t", index_col=0)
	dm.geneExpressionValues = dict([(index, row.tolist()) for index,row in expression.iterrows()])
	return dm


if __name__=="__main__":
	dataModelFromInputFiles().saveJSFile()
	
	
def test_inputFiles():
	dm = dataModelFromInputFiles()
	assert 'name' in dm.metadata
	assert dm.pca.shape==dm.tsne.shape
	assert len(dm.sampleGroups)>=1
	assert set(dm.sampleGroupItems.keys())==set(dm.sampleGroups)
	assert set(dm.clusterItems.keys())==set(dm.clusters)
	assert 'name' in dm.genesets[0] and 'genes' in dm.genesets[0]
