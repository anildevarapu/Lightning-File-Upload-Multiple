public with sharing class AttachmentUploadCon
{
    @AuraEnabled
    public static list<attachmentWrapper> loadAttachments(Id parentId, string sobjAPIName)
    {
        list<attachmentWrapper> awList = new list<attachmentWrapper>();
        
        
        string qryStr = 'Select Id,Name,(Select Id,Name FROM Attachments) FROM '+sobjAPIName+' where id=:parentId';
        list<sobject> records = DataBase.Query(qryStr);
        
        for(Sobject sobj : records)
        {

            for(Attachment att : sobj.getSObjects('Attachments'))
            {   
                attachmentWrapper aw = new attachmentWrapper();
                
                aw.parentId = (string)sobj.get('Id');
                aw.attachmentId = att.Id;
                aw.attachmentName = att.Name;
                awList.add(aw);
            }
            
        }
        return awList;
    }
    public class attachmentWrapper
    {
        
        @AuraEnabled public String parentId;
        @AuraEnabled public String attachmentId;
        @AuraEnabled public String attachmentName;
    }
    @AuraEnabled
    public static void deleteAttachment(string attchId)
    {
        system.debug('attchId '+attchId);
        if(string.isNotBlank(attchId)){
           
           list<Attachment> atchList = [select id from Attachment WHERE ID=: attchId];
            system.debug('--atchList --'+atchList.size());
            if(atchList.size()>0){
                delete atchList;
            }
           
        }
    }

    @AuraEnabled
    public static Id saveChunk(Id parnttId, String attachmentName, String attachmentBody, String attachmentType,String attachmentId) {
       
        attachmentBody = EncodingUtil.urlDecode(attachmentBody, 'UTF-8');
        
        Attachment oAttachment;
        
        if(String.isNotBlank(attachmentId))
        {
            oAttachment = [Select Id,parentId FROM Attachment WHERE Id=:attachmentId];
            
        }
        else
        {            
            oAttachment = new Attachment();
            oAttachment.parentId = parnttId;

        }
        oAttachment.Body = EncodingUtil.base64Decode(attachmentBody);
        oAttachment.Name = attachmentName;
        oAttachment.ContentType = attachmentType;
        upsert oAttachment;

        return oAttachment.Id;
 
        
    }

 

    

}
