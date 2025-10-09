import React, { useEffect, useState } from "react";
import { Card, Row, Col, Container } from "react-bootstrap";
import { getDashboard } from "../api";
import "./Dashboard.css";

const Dashboard = () => {
  const [data, setData] = useState({ lectures: 0, reports: 0, students: 0 });

  useEffect(() => {
    const token = localStorage.getItem("token");
    getDashboard(token)
      .then((res) => setData(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <Container className="mt-4">
      <h2>Dashboard</h2>
      <Row>
        <Col md={4}>
          <Card className="text-center p-3 mb-3">
            <Card.Body>
              <Card.Title>Lectures</Card.Title>
              <Card.Text>{data.lectures}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center p-3 mb-3">
            <Card.Body>
              <Card.Title>Reports</Card.Title>
              <Card.Text>{data.reports}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center p-3 mb-3">
            <Card.Body>
              <Card.Title>Students</Card.Title>
              <Card.Text>{data.students}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
