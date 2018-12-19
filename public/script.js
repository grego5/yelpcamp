$(function(){
    $('#loginBtn').on('click', function(){
        $('#loginModal').modal('show');
    });
    $('#registerBtn').on('click', function(){
        $('#registerModal').modal('show');
    });
    $('#uploadTabs a').on('click', function (e) {
        e.preventDefault();
        $('#imageUpload').val("");
        $("#imgtab2 .custom-file-label").text("Choose file");
        $(this).tab('show');
    });

    $("#imageUpload").change(function () {
        var fieldVal = $(this).val();
        fieldVal = fieldVal.replace("C:\\fakepath\\", "");
            
        if (fieldVal) {
            $(this).next(".custom-file-label").text(fieldVal);
        };
    });
});