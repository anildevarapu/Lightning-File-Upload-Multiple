({
    getAttachments : function(component, event, helper)
    {
        var action = component.get("c.loadAttachments");
        action.setParams({
            communityId: component.get("v.recordId"),
        });
 
        action.setCallback(this, function(response) {
            
            var state = response.getState();
            console.log('state..!',state);
            if (state === "SUCCESS") 
            {
                var cAttachments = response.getReturnValue();
                console.log('attachments..!',cAttachments);
                var rows = [];
                for(var i = 0;i<cAttachments.length;i++)
                {
                    var row = {};
                    row.rowNum = i+1;
                    row.fileId = cAttachments[i].attachmentId;
                    row.fileName = cAttachments[i].attachmentName;
                    row.cDocName = cAttachments[i].cAttachmentName;
                    row.cDocId = cAttachments[i].cAttachmentId;
                    row.cDocError = '';
                    row.showLoadingSpinner = false;
                	rows.push(row);
                }
                if(cAttachments.length == 0)
                    rows.push({'rowNum':1,fileId:'','cDocName':'Attachment - 1','cDocError':'','cDocId':'','fileName':'No File Selected..','showLoadingSpinner':false});
                component.set("v.rows",rows);
            }
            else
            {
            	alert('Something went wrong.');
            }
        });
        $A.enqueueAction(action);
    },
    updateName : function(component, event, helper) {
		  var attachmentId = event.getSource().get('v.class');
          var communityAttachmentName = event.getSource().get('v.value');
    
          if(communityAttachmentName.length >0 && attachmentId.length >0)
          {
              var action = component.get("c.updateCommunityAttachmentName");
                action.setParams({
                    attachmentId: attachmentId,
                    communityAttachmentName:communityAttachmentName
                });
         
                action.setCallback(this, function(response) {
                    var state = response.getState();
                    console.log('state..!',state);
                    if (state === "SUCCESS"){
                        console.log('Name update..!',state);
                    }
                    else{
                        alert('Something went wrong.');
                    }
                });
                $A.enqueueAction(action);
          }
    },
    deleteRow: function(component, event, helper) {
        var index = event.getSource().get('v.name');
        var recId = event.getSource().get('v.class');
        var rows = component.get("v.rows");
        rows.splice(index, 1);
        for(var i = 0;i<rows.length;i++)
        {
            rows[i].rowNum = i+1;
        }
        component.set("v.rows",rows);
        if(recId != '')
        {
            var action = component.get("c.deleteAttachment");
            action.setParams({
                "communityAttachmentId": recId
            });
     
            action.setCallback(this, function(response) {
                var state = response.getState();
                console.log('state..!',state);
                if (state === "SUCCESS"){}
                else
                {
                    alert('Something went wrong.');
                }
            });
            $A.enqueueAction(action);
        }
    },
    clearError : function(component, event, helper)
    {
        var rows = component.get('v.rows');
        var rowIndex = event.getSource().get("v.labelClass");
        rows[rowIndex].cDocError = '';
        component.set('v.rows',rows);
    },
    handleFilesChange: function(component, event, helper) {
        //alert();
        if (event.getSource().get("v.files").length > 0) {
            helper.uploadHelper(component, event);
        }        
    },
    addRow : function(component, event, helper) {
    	var rows = component.get("v.rows");
        var newRow = rows.length+1;
        rows.push({'rowNum':rows.length+1,'fileId':'','cDocName':'Attachment - '+newRow,'cDocError':'','cDocId':'','fileName':'No File Selected..','showLoadingSpinner':false});
        component.set("v.rows",rows);
    }
})
