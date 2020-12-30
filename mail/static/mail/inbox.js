document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email(false));

  // By default, load the inbox
  load_mailbox('inbox');
});

//************IMPORTANT UTILITY FUCNTION*************
/* A utility function to convert JS object into an HTML attributes dictionary
    el   : the element to insert attributes into.
    attrs: the attribute object
*/
function setAttributes(el, attrs) {
  for(var key in attrs) {
    el.setAttribute(key, attrs[key]);
  }
}

function send_email(){
    var recps = document.querySelector('#compose-recipients').value;
    var sub = document.querySelector('#compose-subject').value;
    var bod = document.querySelector('#compose-body').value;

    recps = recps.split(' ').join(',')

    fetch('/emails',{
        method: 'POST',
        body: JSON.stringify({
            recipients: recps,
            subject: sub,
            body: bod
        })
    })
    .then(response => response.json())
    .then(result => {
        console.log(result);

        var message = document.createElement('div');
        var box = '';
        var attributes = {};
        if (result['message'] === undefined) {
            attributes = {'class':'alert alert-danger', 'role':'alert'};
            message.innerHTML = result['error'];
            box = 'inbox';
        }
        else {
            attributes = {'class':'alert alert-success', 'role':'alert'};
            message.innerHTML = result['message'];
            box = 'sent';
        }
        setAttributes(message,attributes);
        load_mailbox(box,message);
    });
    return false;
}

function compose_email(isReply, email=null) {

  // Show compose view and hide other views
  var messageBox = document.querySelector('#message-view');
  messageBox.style.display = 'none';
  if (messageBox.childNodes.length == 1)
      messageBox.removeChild(messageBox.childNodes[0]);
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  var recipients = '', subject = '', body = '';
  if (isReply === true) {
    recipients = email.sender;
    if (email.subject.slice(0,3) !== 'Re:')
      subject = 'Re: ' + email.subject;
    else
      subject = email.subject;
    body = `On ${email.timestamp} ${email.sender} wrote:\n\n` + email.body;
  }
  document.querySelector('#compose-recipients').value = recipients;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;
  document.querySelector('#compose-form').onsubmit = send_email;
}

function load_mail(emailId, mailbox) {
    var messageBox = document.querySelector('#message-view');
    messageBox.style.display = 'none';
    if (messageBox.childNodes.length == 1)
        messageBox.removeChild(messageBox.childNodes[0]);;
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'block';
    //console.log(`mail opened from: ${mailbox}`)
    fetch(`emails/${emailId}`)
    .then(response => response.json())
    .then(function(email) {
        console.log(email)
        //on email click the read property is converted to true.
        fetch(`emails/${emailId}`, {
            method: 'PUT',
            body: JSON.stringify({
                read: true
            })
        });

        //populating the necessary details of an email in the body.
        document.querySelector('#email-from').innerHTML = email.sender;
        document.querySelector('#email-to').innerHTML = email.recipients.join(', ');
        document.querySelector('#email-subject').innerHTML = email.subject;
        document.querySelector('#email-timestamp').innerHTML = email.timestamp;
        document.querySelector('#email-body').innerHTML = email.body;


        if (mailbox == 'sent') {
            document.querySelector('#archive').style.display  = 'none';
            document.querySelector('#unarchive').style.display = 'none';
            document.querySelector('#reply').style.display = 'none';
        }

        if (email.archived === false && mailbox == 'inbox') {

            document.querySelector('#unarchive').style.display = 'none';
            document.querySelector('#archive').style.display = 'inline';
            document.querySelector('#archive').onclick = function() {
                fetch(`emails/${emailId}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        archived: true
                    })
                })
                .then(() => load_mailbox('archive'));
            };
        }
        else if (email.archived === true && mailbox == 'archive') {

            document.querySelector('#archive').style.display = 'none';
            document.querySelector('#unarchive').style.display = 'inline';
            document.querySelector('#unarchive').onclick = function() {
                fetch(`emails/${emailId}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        archived: false
                    })
                })
                .then(() => load_mailbox('inbox'));
            };
        }
        document.querySelector('#reply').onclick = function() {
            compose_email(true,email);
        };
    });
}

function create_row(email, mailbox) {
    const rowElement = document.createElement('div');
    const senderElement = document.createElement('p');
    const subElement = document.createElement('p');
    const timeElement = document.createElement('p');
    var bgColor = "white";

    rowElement.className = 'row align-items-center';
    senderElement.className = 'col font-weight-bold';
    subElement.className = 'col-7 font-weight-normal';
    timeElement.className = 'col text-muted';

    sender = email['sender'];
    subject = email['subject'];
    timestamp = email['timestamp'];

    senderElement.innerHTML = sender;
    subElement.innerHTML = subject;
    timeElement.innerHTML = timestamp;

    if (email['read'] === true && mailbox != 'sent')
        bgColor = "#ebedf0";
    rowElement.style.backgroundColor = bgColor;

    rowElement.append(senderElement);
    rowElement.append(subElement);
    rowElement.append(timeElement);

    rowElement.addEventListener('click', () => load_mail(email.id, mailbox));

    return rowElement;
}

function load_mailbox(mailbox, mssg = null) {

  // Show the mailbox and hide other views
  if (mssg == null){
    var messageBox = document.querySelector('#message-view');
    messageBox.style.display = 'none';
    if (messageBox.childNodes.length == 1)
        messageBox.removeChild(messageBox.childNodes[0]);
  }
  else {
    var messageBox = document.querySelector('#message-view');
    messageBox.style.display = 'block';
    messageBox.append(mssg);
  }
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //console.log(mailbox);
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Print emails
    console.log(emails);

    var rows = emails.length;

    for (let i = 0; i <rows; i++) {
        const row = create_row(emails[i], mailbox);
        document.querySelector('#emails-view').append(row);
    }
  });

}
