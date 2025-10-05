import * as XLSX from 'xlsx';

export const exportToExcel = (data, filename, sheetName = 'Sheet1') => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // Convert data to worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Generate file and trigger download
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportComplaintsToExcel = (complaints) => {
  const formattedData = complaints.map(c => ({
    'Date': new Date(c.created_at).toLocaleDateString(),
    'Subject': c.subject || '-',
    'Message': c.message,
    'Status': c.status,
    'Reply': c.reply || 'No reply yet',
    'PRL': c.prl_name ? `${c.prl_name} ${c.prl_surname}` : c.lecturer_name || '-',
    'Replied At': c.replied_at ? new Date(c.replied_at).toLocaleDateString() : '-'
  }));
  
  exportToExcel(formattedData, 'Complaint_Responses', 'Complaints');
};

export const exportReportsToExcel = (reports) => {
  const formattedData = reports.map(r => ({
    'ID': r.id,
    'Date': r.dateoflecture || r.date_of_lecture,
    'Faculty': r.facultyname || r.faculty_name,
    'Lecturer': r.lecturername || r.lecturer_name,
    'Course': r.coursename || r.course_name,
    'Topic': r.topic,
    'Students Present': r.actualstudents || r.actual_students,
    'Total Students': r.totalstudents || r.total_students,
    'Feedback': r.feedback || 'No feedback',
    'Submitted': new Date(r.submitted_at).toLocaleString()
  }));
  
  exportToExcel(formattedData, 'Lecturer_Reports', 'Reports');
};

export const exportPRLRatingsToExcel = (ratings) => {
  const formattedData = [];
  
  ratings.forEach(prl => {
    if (prl.ratings && prl.ratings.length > 0) {
      prl.ratings.forEach(rating => {
        formattedData.push({
          'PRL Name': `${prl.prl_name} ${prl.prl_surname}`,
          'Stream': prl.stream_name,
          'Rating': rating.rating,
          'Comments': rating.comments,
          'Lecturer': rating.lecturer_name,
          'Date': new Date(rating.submitted_at).toLocaleDateString(),
          'Average Rating': prl.average_rating ? parseFloat(prl.average_rating).toFixed(2) : 'N/A'
        });
      });
    } else {
      formattedData.push({
        'PRL Name': `${prl.prl_name} ${prl.prl_surname}`,
        'Stream': prl.stream_name,
        'Rating': 'No ratings yet',
        'Comments': '-',
        'Lecturer': '-',
        'Date': '-',
        'Average Rating': prl.average_rating ? parseFloat(prl.average_rating).toFixed(2) : 'N/A'
      });
    }
  });
  
  exportToExcel(formattedData, 'PRL_Ratings', 'PRL Ratings');
};