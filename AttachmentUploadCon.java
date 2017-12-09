public with sharing class AttachmentUploadCon
{
    @AuraEnabled
    public static list<attachmentWrapper> loadAttachments(Id communityId)
    {
        list<attachmentWrapper> awList = new list<attachmentWrapper>();
        list<Community_Attachment__c> cAttachments = [Select Id,Name,(Select Id,Name FROM Attachments) FROM Community_Attachment__c WHERE  Community__c=:communityId];
        for(Community_Attachment__c ca : cAttachments)
        {
            attachmentWrapper aw = new attachmentWrapper();
            aw.cAttachmentName = ca.Name;
            aw.cAttachmentId = ca.Id;
            for(Attachment att : ca.Attachments)
            {
                aw.attachmentId = att.Id;
                aw.attachmentName = att.Name;
            }
            awList.add(aw);
        }
        return awList;
    }
    public class attachmentWrapper
    {
        @AuraEnabled public String cAttachmentName;
        @AuraEnabled public String cAttachmentId;
        @AuraEnabled public String attachmentId;
        @AuraEnabled public String attachmentName;
    }
    @AuraEnabled
    public static void deleteAttachment(Id communityAttachmentId)
    {
        delete [Select Id,Name FROM Community_Attachment__c WHERE Id =: communityAttachmentId];
        delete [select id from SBQQ__RelatedContent__c where Community_Id__c =: communityAttachmentId];
    }
    @AuraEnabled
    public static void updateCommunityAttachmentName(String attachmentId,String communityAttachmentName) {
        List<SBQQ__RelatedContent__c> additionalDocument = new List<SBQQ__RelatedContent__c>();
        Attachment att = [Select Id,ParentId FROM Attachment WHERE Id=:attachmentId];
        Community_Attachment__c ca = new Community_Attachment__c();
        ca.Id = att.ParentId;
        ca.Name = communityAttachmentName;
        update ca;
        
        additionalDocument = [select Id,Name from SBQQ__RelatedContent__c where Community_Id__c =: att.ParentId];
        for(SBQQ__RelatedContent__c rc : additionalDocument){
            rc.Name = communityAttachmentName;
        }
        update additionalDocument;
    }
    @AuraEnabled
    public static Id saveChunk(Id communityId, String attachmentName, String attachmentBody, String attachmentType, String fileId,String attachmentId,String communityAttachmentName,String communityAttachmentId) {
       
        if (fileId == '') {
            fileId = saveTheFile(communityId, attachmentName, attachmentBody, attachmentType,attachmentId,communityAttachmentName,communityAttachmentId);
        } else {
            appendToFile(fileId, attachmentBody);
        }
 
        return Id.valueOf(fileId);
    }
 
    public static Id saveTheFile(Id communityId, String attachmentName, String attachmentBody, String attachmentType,String attachmentId,String communityAttachmentName,String communityAttachmentId) 
    {
        Community_Attachment__c ca = new Community_Attachment__c();
        ca.Community__c = communityId;
        ca.Id = string.IsBlank(communityAttachmentId) ? null : communityAttachmentId;
        ca.Name = communityAttachmentName;        
        upsert ca;
        
        attachmentBody = EncodingUtil.urlDecode(attachmentBody, 'UTF-8');
        
        Attachment oAttachment;
        list<SBQQ__RelatedContent__c> additionalDocuments;
        if(String.isNotBlank(attachmentId))
        {
            oAttachment = [Select Id,parentId FROM Attachment WHERE Id=:attachmentId];
            additionalDocuments = [select Id,Name from SBQQ__RelatedContent__c where Community_Id__c =: communityAttachmentId];
            for(SBQQ__RelatedContent__c ad : additionalDocuments){
                ad.Name = communityAttachmentName;
            }
        }
        else
        {            
            oAttachment = new Attachment();
            oAttachment.parentId = ca.Id;
            
            additionalDocuments = new list<SBQQ__RelatedContent__c>();
            SBQQ__RelatedContent__c aDoc = new SBQQ__RelatedContent__c();
            aDoc.Community_Id__c = ca.id;
            aDoc.Name = communityAttachmentName;
            additionalDocuments.add(aDoc);
        }
        oAttachment.Body = EncodingUtil.base64Decode(attachmentBody);
        oAttachment.Name = communityAttachmentName; //attachmentName
        oAttachment.ContentType = attachmentType;
        upsert oAttachment;
        
        List<SBQQ__Quote__c> quoteList = [select id,Community__c from SBQQ__Quote__c where Community__c =: communityId];
        if(!quoteList.isEmpty())
        {
            for(SBQQ__RelatedContent__c ad : additionalDocuments)
            {
                ad.SBQQ__ExternalId__c = oAttachment.id;
                ad.SBQQ__Quote__c = quoteList[0].id;
            }
            
            upsert additionalDocuments;
        }
        return oAttachment.Id;
    }
 
    private static void appendToFile(Id fileId, String base64Data) 
    {
        base64Data = EncodingUtil.urlDecode(base64Data, 'UTF-8');
        Attachment a = [SELECT Id, Body FROM Attachment WHERE Id =: fileId];
        String existingBody = EncodingUtil.base64Encode(a.Body);
        a.Body = EncodingUtil.base64Decode(existingBody + base64Data);
        update a;
    }
    
    //Invokes in Quote Trigger to insert or update the Additional Document upon creating new quote or by modifying community.
    public static void addCommunityDiscloure(Map<Id, SBQQ__Quote__c> newQuoteRecords, Map<Id, SBQQ__Quote__c> oldQuoteRecords){
        set<Id> communityId = new set<Id>();
        for(SBQQ__Quote__c q : newQuoteRecords.values()){
            if(q.Community__c <> null && (oldQuoteRecords.isEmpty() || q.Community__c <> oldQuoteRecords.get(q.Id).Community__c)) 
               communityId.add(q.Community__c);
        }
        List<SBQQ__RelatedContent__c> additionalDocuments = new List<SBQQ__RelatedContent__c>();
        List<Community_Attachment__c> communityAttachments = [select id, Name, Community__c, (select id from Attachments) from Community_Attachment__c where Community__c In: communityId];
        for(SBQQ__Quote__c q : newQuoteRecords.values()){
            for(Community_Attachment__c ct : communityAttachments){
                if(ct.Community__c == q.Community__c){
                    for(Attachment at : ct.Attachments){
                        SBQQ__RelatedContent__c rc = new SBQQ__RelatedContent__c();
                        rc.SBQQ__ExternalId__c = at.Id;
                        rc.Name = ct.name;
                        rc.SBQQ__Quote__c = q.Id;
                        rc.SBQQ__Required__c = false;
                        rc.Community_Id__c = q.Community__c;
                        additionalDocuments.add(rc);
                    } 
                }       
            }
        }     
        insert additionalDocuments;   
    }
}
