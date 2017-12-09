({
	initComp: function(component, event, helper) {
		
		helper.getAttachments(component, event);
	
	},
    deleteRow: function(component, event, helper) {
        var index = event.getSource().get('v.name');
        var clsName = event.getSource().get('v.class');

		
		console.log('recId@ delete', clsName.split('atcID_'));
        
		var clasAray = !$A.util.isEmpty(clsName) ? clsName.split('atcID_') : [];
		var recId = !$A.util.isEmpty(clasAray) ? clasAray[1] : '';
        if(!$A.util.isEmpty(recId))
        {
           
            var action = component.get("c.deleteAttachment");
            action.setParams({"attchId": recId});
     
            action.setCallback(this, function(response) {
                var state = response.getState();
                console.log('state..!',state);
                if (state === "SUCCESS"){
                    helper.getAttachments(component, event);
                }
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
            console.log('---@handleFilesChange---');
            helper.uploadHelper(component, event);
        }        
    },
    addRow : function(component, event, helper) {
    	var rows = component.get("v.rows");
        var newRow = rows.length+1;
        rows.push({'rowNum':rows.length+1,'fileId':'','cDocError':'','parentId':'','fileName':'No File Selected..','showLoadingSpinner':false});
        component.set("v.rows",rows);
    }
})
