({
    MAX_FILE_SIZE: 4500000, //Max file size 4.5 MB 
    CHUNK_SIZE: 750000,      //Chunk Max size 750Kb 
    
    uploadHelper: function(component, event) {
        // start/show the loading spinner   
        // get the selected files using aura:id [return array of files]
        var rowIndex = event.getSource().get('v.class');
        var attachmentId = event.getSource().get('v.name');
        var rows = component.get('v.rows');
        rows[rowIndex].showLoadingSpinner = true;
        component.set('v.rows',rows);
        var fileInput;
        
        if(typeof component.find("fileId")[rowIndex] == 'undefined')
        	fileInput = component.find("fileId").get("v.files");
        else
            fileInput = component.find("fileId")[rowIndex].get("v.files");
        
        // get the first file using array index[0]  
        var file = fileInput[0];
        var self = this;
        var cDocName = rows[rowIndex].cDocName;
        var cDocId = rows[rowIndex].cDocId;
        if(cDocName == '')
        {
            console.log('Name is Blank');
            rows[rowIndex].cDocError = 'Name is required';
            rows[rowIndex].showLoadingSpinner = false;
            component.set('v.rows',rows);
            return;
        }
        // check the selected file size, if select file size greter then MAX_FILE_SIZE,
        // then show a alert msg to user,hide the loading spinner and return from function  
        if (file.size > self.MAX_FILE_SIZE) {
            console.log('size exceeded.');
            rows[rowIndex].showLoadingSpinner = false;
            rows[rowIndex].fileName = 'Alert : File size cannot exceed ' + self.MAX_FILE_SIZE + ' bytes.\n' + ' Selected file size: ' + file.size;
            component.set('v.rows',rows);
            return;
        }
 
        // create a FileReader object 
        var objFileReader = new FileReader();
        // set onload function of FileReader object   
        objFileReader.onload = $A.getCallback(function() {
            var fileContents = objFileReader.result;
            var base64 = 'base64,';
            var dataStart = fileContents.indexOf(base64) + base64.length;
 
            fileContents = fileContents.substring(dataStart);
            // call the uploadProcess method 
            self.uploadProcess(component, file, fileContents,rowIndex,attachmentId,cDocName,cDocId);
        });
 
        objFileReader.readAsDataURL(file);
    },
 
    uploadProcess: function(component, file, fileContents,rowIndex,attachmentId,cDocName,cDocId) {
        // set a default size or startpostiton as 0 
        var startPosition = 0;
        // calculate the end size or endPostion using Math.min() function which is return the min. value   
        var endPosition = Math.min(fileContents.length, startPosition + this.CHUNK_SIZE);
 
        // start with the initial chunk, and set the attachId(last parameter)is null in begin
        this.uploadInChunk(component, file, fileContents, startPosition, endPosition, '',rowIndex,attachmentId,cDocName,cDocId);
    },
 
 
    uploadInChunk: function(component, file, fileContents, startPosition, endPosition, attachId,rowIndex,attachmentId,cDocName,cDocId) {
        // call the apex method 'saveChunk'
        var getchunk = fileContents.substring(startPosition, endPosition);
        var action = component.get("c.saveChunk");
        action.setParams({
            communityId: component.get("v.recordId"),
            attachmentName: file.name,
            attachmentBody: encodeURIComponent(getchunk),
            attachmentType: file.type,
            fileId: attachId,
            attachmentId:attachmentId,
            communityAttachmentName:cDocName,
            communityAttachmentId : cDocId,
        });
 
        // set call back 
        action.setCallback(this, function(response) {
            // store the response / Attachment Id   
            attachId = response.getReturnValue();
            var state = response.getState();
            if (state === "SUCCESS") {
                // update the start position with end postion
                startPosition = endPosition;
                endPosition = Math.min(fileContents.length, startPosition + this.CHUNK_SIZE);
                // check if the start postion is still less then end postion 
                // then call again 'uploadInChunk' method , 
                // else, diaply alert msg and hide the loading spinner
                if (startPosition < endPosition) {
                    this.uploadInChunk(component, file, fileContents, startPosition, endPosition, attachId,rowIndex);
                } else {
                    var rows = component.get('v.rows');
                    rows[rowIndex].showLoadingSpinner = false;
                    rows[rowIndex].fileName = file.name;
                    rows[rowIndex].fileId = attachId;
                    component.set('v.rows',rows);
                    //alert('your File is uploaded successfully');
                }
                // handel the response errors        
            } else if (state === "INCOMPLETE") {
                alert("From server: " + response.getReturnValue());
            } else if (state === "ERROR") {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        console.log("Error message: " + errors[0].message);
                    }
                } else {
                    console.log("Unknown error");
                }
            }
        });
        // enqueue the action
        $A.enqueueAction(action);
    }
})
