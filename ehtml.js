const fs = require('fs');
const path = require('path');
const ENCODING = 'utf8';
const DEFAULT_BASE_DIR = './';
const WRITE_BASE_DIR = './Texts';
const TEXT_BASE_DIR = './Text/';
const HTML_FILES = ['.html','.htm'];
const TS_FILES = ['.ts'];
const JS_FILES = ['.js'];
const DIRECTORIES = [''];

var content;
var theContentArray = [];


function fileReader() {
	fs.readFile('./index.html', ENCODING, function read(err, data) {
	    if (err) { throw err; }
	    content = data;
	    processFile();
	});
}


function processFile() {
    console.log(content);
}


// Warning: assumes that if not included means you want to hide/ignore it, hence returns true
function isHidden(fileName, include) {
	return include ? (fileName.substr(0, 1)==="." ? true : false) : true;
}


function isRequiredExtension(fileName, arrayExtensionsRequired) {
	var ret = false;
	for(var j=0; j<arrayExtensionsRequired.length; ++j) {
		if(arrayExtensionsRequired[j] === path.extname(fileName)) { return true; }
	}
	return ret;
}


function isEmptyString(str) {
	return str.length===0;
}


/*
* strip the rest of typescript and leave the html (returned) to be ripped off later
* html captured are mostly inline template
*/
function stripRestOf_TS(content) {	
	const captureTemplate = /template\s{0,}\:\s{0,}\`{1}[\n\r\t\w\d\s\W]{0,}.{0,}[`]{1}[,]{1}/ig;
	const removeTemplateLine = /template\s{0,}\:\s{0,}\`/ig;
	const removeFinalTemplateQuote = /[`]{1}[,]{0,1}/ig;
	var netArray = content.match(captureTemplate);
	if(netArray !== null) {
		return netArray[0].replace(removeTemplateLine, '').replace(removeFinalTemplateQuote, '');
	}
	else { return ""; }
}


function stripAllHTML(content) {		
	const removeNgIfValues = /\*\w{0,}\s{0,1}\=\s{0,1}[\"\'\w\[\(][\w]{0,}[\(\[]{1}[\)\]]{1}[\!\=]{0,}[\'\w\"]{0,}/ig;
	const removeAttributeValues = /\s{0,}[\*\w\(\)\[\]\-\.\@\#]{0,}\s{0,}\={1}\s{0,}[\"\']{1}[\w\d\s\-\.\!\(\)\=\[\]\?\<\>\;\&\'\/\$\:\|\+\,\{\}\%\*]{0,}[\"\']{1}/ig;
	const removeRouterLinkValues = /\s{0,}\=\s{0,}[\"\']{1}[\[\w\(]{1}[\']{1}[\/\w\d\-]{0,}[\']{1}[\]\w\)]{1}[\"\']{1}/ig;
	const removeBracketAttributes = /[\[\(]{0,}[\w\-\.]{0,}[\]\)]/ig;
	const removeIdAttributes = /(\s{1,}[\#][\w]{1,})/ig;
	const removeTags = /<\/*[\!\w\-\s]*\s*[\/]{0,}\>/ig;
	const removeComments = /\<\![\-]{2,}[\r\n\t\w\d\s]{0,}.{0,}\-{2}\>/ig;
	const removeHtmlEntities = /&.{1,};{1}/ig;
	const removeInterpolation = /\{{2}.{0,}[\?\[\]\<\>\=]{0,}\}{2}/ig;
	return content
	.replace(removeAttributeValues, '')
	.replace(removeHtmlEntities, '')
	.replace(removeInterpolation, '')
	.replace(removeNgIfValues, '')
	.replace(removeRouterLinkValues, '')
	.replace(removeIdAttributes, '')
	.replace(removeTags, '\t')
	.replace(removeComments, '')
	;	
}

function removePattern(regex, content) {
	return content.replace(regex, '');
}

function replacePattern(regex, content, replaceWith) {
	return content.replace(regex, replaceWith);
}

function removeEPSG(array) {
	return removePattern(/[\"\']{1}EPSG/g, array.join("\n"));
}


function removeClass(str) {
	return removePattern(/\.[\w\-\_.\d]{1,}[[][\w]{1,}[=]/ig, str);
}


function removeNSEW(string) {
	return removePattern(/[\"\']{1}[NSEW\b]{1}[\,]{0,1}[\d]{0,}/g, string);
}

function removeLineComments(string) {
	return removePattern(/(\/\/.{0,}$)+?/igm, string);
}


function removeFrontQuotes(string) {
	return removePattern(/[\"\']{1}/g, string);
}

function removeSingleAlphabet(string) {
	return removePattern(/^[A-Z\b]{1}\b$/gm, string);
}

function removeEscapeCharacters(string) {
	return replacePattern(/\\\"/ig, replacePattern(/\\\'/ig, string, "'"), '"');
}


function getAnyQuotedStrings(content) {
	// const extractDoubleQuotes = /[\"]{1}[\w\d\s\_\'\,\*\.\#\:\<\>\/\(\)\-\\\[\]\=\+\;]{0,}[\"]{1}/ig;
	// const extractSingleQuotes = /[\']{1}[\w\d\s\_\"\,\*\.\#\:\<\>\/\(\)\-\\\[\]\=\+\;]{0,}[\']{1}/ig;

	const extractDoubleQuotes = /[\"]{1}[\w\:\s\.\(\)\-\'\\]{0,}.{0,}[\"]{1}/ig;
	// const extractSingleQuotes = /[\']{1}[\w\:\s\.\(\)\-\'\\]{0,}.{0,}[\']{1}/ig;
	const extractSingleQuotes = /[']{1}[\w\d)"*.,\s:(\-;\+\\\/<>&(\\')#_]{0,}[']/ig;
	// var doubleQuoteArray = content.match(extractDoubleQuotes);
	var singleQuoteArray = content.match(extractSingleQuotes);
	var contentString = "";
	// if(doubleQuoteArray !== null) {		
	// 	var contentArray = [];
	// 	if(doubleQuoteArray !== null) { contentArray = doubleQuoteArray.concat(singleQuoteArray); }	
	// 	contentString = contentArray.join('\n');
	// 	return contentString;
	// } else { return ''; }

	if(singleQuoteArray !== null) {
		var contentArray = [];
		// if(doubleQuoteArray !== null) { contentArray = doubleQuoteArray.concat(singleQuoteArray); }	
		contentString = singleQuoteArray.join('\n');
		return contentString;
	} else { return ''; }

}


function replaceEscapedSingleQuotes(content) {
	var replaceEscaped = /\\{1}[']{1}/igm;
	return replacePattern(replaceEscaped, content, '\'');
}

function replaceEscapedDoubleQuotes(content) {
	var replaceEscaped = /\\{1}["]{1}/igm;
	return replacePattern(replaceEscaped, content, '\"');
}



function replaceHtmlEntities(content) {
	const replaceHtmlEntities = /&.{1,};{1}/ig;
	return replacePattern(replaceHtmlEntities, content, " ");
}


function removeLines(content) {
	const r1 = /['"]{1}[#*'_]{1}.{0,}["']{1}/ig;
	const input = /['"]input{1}[([\]=".\w]{0,}['"]{1}/ig;
	const not = /['"].{0,}[:.]not[(\[]{0,}.{0,}['"]/g;
	const bool = /['"].{0,}[&|=]{2}.{0,}['"]/ig;
	const underscore = /['"].{0,}[_.]{1}[\w\d]{0,}[_]{1}.{0,}\b['"]/g;
	const methods = /['"].{0,}\.[\w]{0,}[([].{0,}['"]/ig;
	const specialChar1 = /['"][\w\d]{0,}[#.]{1}[\w\d]{0,}[#.]{1}[\w\d]{0,}['"]/ig;
	const variables1 = /['"][a-z.][a-zA-Z\-_:.]{1,}[A-Z.]{0,}['"]/g;
	const linkedClassIds = /['"][\w\d]{0,}[#.][\w\d\s,]{0,}[#. ][\w\d]{0,}['"]/ig;
	return removePattern ( variables1,
		removePattern ( linkedClassIds,
		removePattern ( methods,
		removePattern ( underscore,
		removePattern ( bool, 
		removePattern ( not, 
		removePattern ( input, 
		removePattern(r1, content) ) ) ) ) ) )
		);
}

function extractSingleQuotes(contentString) {
	var contentArraySingles = contentString.match(/[']{1}[\w\d)"*.,\s:(\-;\+\\\/<>]{0,}[']/g);
	return contentArraySingles;
}

/*
function cleanSentenceJS(content, fileName) {
		return removeFrontQuotes( removeClass( removeLines( replaceHtmlEntities( replaceEscapedDoubleQuotes( replaceEscapedSingleQuotes(content) ) ) ) ) );
}
*/

function cleanSentenceJS(content, fileName) {
		return removeLines( replaceHtmlEntities( replaceEscapedDoubleQuotes( replaceEscapedSingleQuotes(content) ) ) );
}


function stripRestOf_JS(content, fileName) { 
	
	// console.log(content);
	return extractSingleQuotes( replaceHtmlEntities( replaceEscapedDoubleQuotes( replaceEscapedSingleQuotes( removeLineComments(content) ) ) ) )
			.join("\n");

	/* if(fileName === "./custom-validation.js") { 
		const naturalSentence = /[\"\']{1}[A-Z]{1}[\w\s\,\.]{0,}/g;
		var theQuotedStrings = getAnyQuotedStrings(content);
		if( theQuotedStrings !== null ) { 
			return cleanSentenceJS(theQuotedStrings, fileName); 
		}	
		else { return ""; }
	 } */
	/* else {
		const naturalSentence = /[\"\']{1}[A-Z]{1}[\w\s\,\.]{0,}/g;
		var theQuotedStrings = getAnyQuotedStrings(content);
		const sentenceArray = theQuotedStrings.match(naturalSentence);	
		if( sentenceArray !== null ) { 
			var final = stripAllHTML( cleanSentenceJS(sentenceArray.join('\n'), fileName) ); 
			return final; 
		}	
		else { return ""; }
	 }*/
	
}




function readWriteHTMLContent(fileName) {
	fs.readFile(DEFAULT_BASE_DIR+fileName, ENCODING, function (err, data) {
		if (err) { throw err; }
		content = data;
		content = stripAllHTML(content);	
		fs.writeFile(DEFAULT_BASE_DIR+fileName+'.txt', content, function (err) {
	        if (err) { return console.log(err); }        
	        console.log('Saved: '+fileName+'.txt');
	    });
		console.log(content);   
	});	
}


function readWriteTSContent(fileName) {
	fs.readFile(DEFAULT_BASE_DIR+fileName, ENCODING, function (err, data) {
		if (err) { throw err; }
		content = data;
		content = stripAllHTML(stripRestOf_TS(content));
		if(content !== "") {
			fs.writeFile(DEFAULT_BASE_DIR+fileName+'.txt', content, function (err) {
		        if (err) { return console.log(err); }        
		        console.log('Saved: '+fileName+'.txt');
		    });
			console.log(content);   
		}
	});
}


function readWriteJSContent(thePath, fileName) { 
	fs.readFile(DEFAULT_BASE_DIR+thePath+fileName, ENCODING, function (err, data) {
		if (err) { throw err; }
		content = data;
		content = stripRestOf_JS(content, thePath+fileName);
		// content = stripAllHTML(stripRestOf_JS(content, thePath+fileName));			
		fs.writeFile(DEFAULT_BASE_DIR+thePath+fileName+'.txt', content, function (err) {
	        if (err) { return console.log(err); }        
	        console.log('Saved: '+thePath+fileName+'.txt');
	    });
		// console.log(content);   
	});	
}


// function readDirectory(dirName = "", includeExt = ['.js','.html','.ts'], excludeFiles = [''], sep=",") {
function readDirectory(dirName) {	
	if( ! isEmptyString(dirName) ) {		
		fs.readdir(dirName, ENCODING, function (err, data) {						
			processRequiredFiles(data, dirName);
		});
	}
}


function processRequiredFiles(files, directoryPath) {	
	if(files !== []) {
		// fs.mkdir(WRITE_BASE_DIR, (err, folder)=>{
		// 	if(!err) { console.log(folder+" created");  }
		// });	
		files.forEach(function(value, index) {
				if( ! isHidden(value, true) ) {										
					if(isRequiredExtension(value, DIRECTORIES)) { 
						var fullDirectoryPath = directoryPath+value+"\/";						
						// fs.mkdir(WRITE_BASE_DIR+fullDirectoryPath, (err, folder)=>{
						// 	if(!err) { console.log(folder+" created"); }
						// });							
						readDirectory(fullDirectoryPath);
					}
					if(isRequiredExtension(value, HTML_FILES)) { readWriteHTMLContent(directoryPath+value); }	
					if(isRequiredExtension(value, TS_FILES)) { readWriteTSContent(directoryPath+value); }		
					if(isRequiredExtension(value, JS_FILES)) { 
						readWriteJSContent(directoryPath, value); 
						// fs.mkdir(directoryPath+"test", (err, folder) => {
						// 	if(err) { throw err; }
						// 	console.log(folder);
						// });
					}
				}
		});
	}
}


function Main() {
	readDirectory(DEFAULT_BASE_DIR);	
}


Main();
