Iscandar
======
**Iscandar** is a set of python scripts and html/javascript files used to create interactive report for single cell rna-seq analysis. The report is a fully self-contained folder where the html file accesses all required javascript files within the same location.


## How to use it
Clone this repo and populate all the files in the input directory. Then run:
```bash
python create_data_model.py
```
That's all. This python script overwrites output/js/data-model.js file by reading all the files in the input directory. output directory contains all the files required for the report, and can be sent to the user. Just open Report.html in a browser to use the report.

## Alternate usage
Another option is to bypass input file creation and do the following in your own python script (or jupyter notebook): 
```python
from create_data_model import DataModel
dm = DataModel()
dm.metadata = {'name':'pera', ...}
dm.analysisMetadata = {...}
...
dm.saveJSFile()
```
Here we assign each of the required input variables directly to the DataModel class and invoke its saveJSFile() method to save the file to arrive at the same result.

## Description of Required input files under input/:
Each file comes with example data so that its required format can be easily worked out. More detailed descriptions are here. All tables use tab as column separators.

### analysisMetadata.txt
Contains description of the analysis performed, and is in a two column table format in a key-value relationship. None of the keys are required fields.

### clusterItems.txt
Contains names of clusters and which items belong to each cluster, as well as what colour to use for each item in the cluster.

### clusters.txt
Mapping of sample ids to cluster items. Ensure that column headers here match cluster names found in clusterItems.txt.

### expression.txt
Expression matrix in the usual format of genes as row ids and sample ids as columns. Note that user can only search for gene expression if the gene occurs as a row id in this matrix. So if gene ids are used, the user has to use the same ids for search. Also note that larger this matrix is, the larger the report will be in size and longer the loading time, as this takes up the vast majority of the data.

### genesets.txt
List of gene sets in 3 column table format, where first column is the name of the gene set, second is the list of genes joined by comma, and third is the mean expression value of the gene set for each cell joined by comma (so these should match the ordering of the sample ids in pca.txt). Note that genes here can actually be different to the row ids of expression matrix, as the report does not compute the mean expression values but just uses the values supplied in the 3rd column.

### metadata.txt
Description of the dataset in a two column table format. "name" key is the only required key, used by the app.

### pca.txt
pca coordinates used by the report to show pca, in Nx2 format table, where N=number of samples. Note that ordering of sample ids in this data frame will be assumed for all lists requring sample id list.

### sampleGroupItems.txt
Contains names of sample groups and which items belong to each sample group, as well as what colour to use for each item in the sample group. A 'sampleGroup' is some grouping of samples, such as celltype, timepoint, etc. And each sample group will comprise of the items specified in the second column. Note that same ordering of the items here will be used to draw each trace for that sample group in the report.

### samples.txt
Mapping of sample ids to sample group items. Ensure that column headers here match sample group names found in sampleGroupItems.txt.

### tsne.txt
tsne coordinates used by the report to show tsne, in Nx2 format table, where N=number of samples. This table should have identical row indices as pca.txt.


---

## Notes
I'm just adding some useful notes for development of Iscandar here.

#### Adding a custom javascript file to main.js
See data-model.js for an example of how this is done. Summary:
Suppose we want to add a separate javascript file called test.js, whose content is:

```javascript
"use strict";
define(function(require, exports, module) {
	module.exports = {
	  data: ['a','b'],
	  hello: function() {
		return 'hello';
	  },
	};
});
```

We want to include it in main.js so that we can access its data and functions. Modify main.js so that
```javascript
require.config({
    baseUrl: 'js',
    paths: {
        d3:     'd3.v3.min',
        vue:	'vue.min',
        plotly: 'plotly-latest.min',
        test: 	'test',
    },
});

define(['d3', 'vue.min', 'plotly-latest.min', 'test'], function(d3, Vue, Plotly, Test) {
	console.log(Test.hello());
});
```

#### Vue tips
Note that if the component's template is defined in the html, use inline-template attribute on the tag if it occurs inside the dom element of the main Vue app. 
See https://sebastiandedeyne.com/posts/2016/dealing-with-templates-in-vue-20 for more info.

The lasso dialog is an example of a component that we can add not inline. Note that it needs to be inside wrapperDiv but doesn't work inside another component. Some useful info here: https://adamwathan.me/2016/01/04/composing-reusable-modal-dialogs-with-vuejs/


#### Plotly tips
Plotly.newPlot("plotDiv", ...) redraws over "#plotDiv", and seems fast enough without having to delete and add traces. To delete traces, you have to supply an array of indices matching the traces to delete, eg. [0,3]. So if there are 5 traces and you want to delete them all, the indices must be [0,1,2,3,4]:
```javascript
Plotly.deleteTraces("plotDiv", [0,1,2,3,4]);
```

Plotly.downloadImage() function automatically invokes the download file on the browser:
```javascript
Plotly.downloadImage(document.getElementById("plotDiv"), {format: 'png', width: 1000, height: 700, filename: "myfile"});
```
---

## Contact
**Jarny Choi**, stemformatics.org (jarny@stemformatics.org)

## Changes 
* v0.1.1 - initial version.

## License
[MIT License](LICENSE.txt)

