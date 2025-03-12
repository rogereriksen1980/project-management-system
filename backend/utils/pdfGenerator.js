const PDFDocument = require('pdfkit');

/**
 * Generate a PDF for meeting notes
 * @param {Object} meeting - Meeting data
 * @param {Array} tasks - Task data
 * @returns {Buffer} PDF as buffer
 */
exports.generateMeetingNotesPDF = async (meeting, tasks) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      
      // Collect the data on a writable stream
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      
      // Add headers and metadata
      doc.fontSize(20).text('Meeting Notes', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12).text(`Project: ${meeting.projectId.name}`);
      doc.text(`Meeting: ${meeting.title}`);
      doc.text(`Date: ${new Date(meeting.date).toLocaleDateString()}`);
      doc.text(`Location: ${meeting.location || 'Not specified'}`);
      
      // Add attendees
      doc.moveDown();
      doc.fontSize(14).text('Attendees:', { underline: true });
      doc.fontSize(12);
      
      meeting.attendees.forEach(attendee => {
        doc.text(`• ${attendee.name}`);
      });
      
      // Add meeting notes
      doc.moveDown();
      doc.fontSize(14).text('Notes:', { underline: true });
      doc.fontSize(12);
      
      // If notes are HTML, we need to strip tags for PDF
      const notesText = meeting.notes ? 
        meeting.notes.replace(/<[^>]*>?/gm, '') : 
        'No notes provided';
        
      doc.text(notesText);
      
      // Add tasks
      doc.moveDown();
      doc.fontSize(14).text('Tasks:', { underline: true });
      
      // Create task table
      const taskTableTop = doc.y + 10;
      const taskColumnWidth = 150;
      
      // Add table header
      doc.fontSize(10);
      doc.text('Task Description', 50, taskTableTop);
      doc.text('Responsible', 50 + taskColumnWidth * 1, taskTableTop);
      doc.text('Due Date', 50 + taskColumnWidth * 2, taskTableTop);
      doc.text('Status', 50 + taskColumnWidth * 3, taskTableTop);
      
      doc.moveTo(50, taskTableTop - 5)
         .lineTo(50 + taskColumnWidth * 4, taskTableTop - 5)
         .stroke();
         
      doc.moveTo(50, taskTableTop + 15)
         .lineTo(50 + taskColumnWidth * 4, taskTableTop + 15)
         .stroke();
      
      // Add task rows
      let taskY = taskTableTop + 25;
      
      tasks.forEach((task, index) => {
        // Check if we need a new page
        if (taskY > doc.page.height - 100) {
          doc.addPage();
          taskY = 50;
          
          // Re-add header on new page
          doc.fontSize(10);
          doc.text('Task Description', 50, taskY);
          doc.text('Responsible', 50 + taskColumnWidth * 1, taskY);
          doc.text('Due Date', 50 + taskColumnWidth * 2, taskY);
          doc.text('Status', 50 + taskColumnWidth * 3, taskY);
          
          doc.moveTo(50, taskY - 5)
             .lineTo(50 + taskColumnWidth * 4, taskY - 5)
             .stroke();
             
          doc.moveTo(50, taskY + 15)
             .lineTo(50 + taskColumnWidth * 4, taskY + 15)
             .stroke();
             
          taskY += 25;
        }
        
        doc.fontSize(10);
        doc.text(task.description, 50, taskY, { width: taskColumnWidth - 10 });
        doc.text(task.responsibleMemberId.name, 50 + taskColumnWidth * 1, taskY);
        doc.text(
          task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date', 
          50 + taskColumnWidth * 2, 
          taskY
        );
        doc.text(
          task.status.charAt(0).toUpperCase() + task.status.slice(1), 
          50 + taskColumnWidth * 3, 
          taskY
        );
        
        // Calculate height needed for this row based on content
        const textHeight = Math.max(
          doc.heightOfString(task.description, { width: taskColumnWidth - 10 }),
          doc.heightOfString(task.responsibleMemberId.name),
          20 // Minimum row height
        );
        
        // Draw line after the row
        taskY += textHeight + 5;
        doc.moveTo(50, taskY)
           .lineTo(50 + taskColumnWidth * 4, taskY)
           .stroke();
           
        taskY += 10;
      });
      
      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
