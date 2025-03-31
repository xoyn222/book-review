import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import InfiniteScroll from "react-infinite-scroll-component";
import { Form, Button, Container, Row, Col, Card, Table, InputGroup, FormControl, Nav } from "react-bootstrap";
import ReactSelect from "react-select";
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { CSVLink } from "react-csv";

const languages = [
    { value: "en", label: "English (US)" },
    { value: "de", label: "Deutsch (Germany)" },
    { value: "fr", label: "Français (France)" },
];

function App() {
    const [settings, setSettings] = useState({
        language: "en",
        seed: "2535653423",
        likes: 5,
        reviews: 4.7,
    });
    const [books, setBooks] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [expandedBook, setExpandedBook] = useState(null);
    const [viewMode, setViewMode] = useState('table');
    const csvLinkRef = useRef(null);

    useEffect(() => {
        setBooks([]);
        setPage(1);
        setHasMore(true);
        fetchBooks(1, true);
    }, [settings.language, settings.seed, settings.likes, settings.reviews]);

    const fetchBooks = async (pageNum = page, isReset = false) => {
        try {
            const res = await axios.get(`book-review-back-production.up.railway.app/books`, {
                params: {
                    language: settings.language,
                    seed: settings.seed,
                    likes: settings.likes,
                    reviews: settings.reviews,
                    page: pageNum,
                    perPage: pageNum === 1 ? 20 : 10
                },
            });

            if (res.data.length === 0) {
                setHasMore(false);
                return;
            }

            if (isReset) {
                setBooks(res.data);
            } else {
                setBooks((prev) => [...prev, ...res.data]);
            }

            setPage(pageNum + 1);
        } catch (error) {
            console.error("Error fetching books:", error);
            setHasMore(false);
        }
    };

    const handleSettingChange = (key, value) => {
        setSettings(prevSettings => ({
            ...prevSettings,
            [key]: value
        }));
    };

    const getStarRating = (rating) => {
        return (
            <div className="star-rating">
                {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < Math.floor(rating) ? "star filled" : "star"}>★</span>
                ))}
                <span className="rating-value ms-2">({rating})</span>
            </div>
        );
    };

    const handleExportCSV = () => {
        if (csvLinkRef.current) {
            csvLinkRef.current.link.click();
        }
    };

    const getCSVData = () => {
        return books.map(book => ({
            Index: book.index,
            ISBN: book.isbn,
            Title: book.title,
            Author: book.author,
            Publisher: book.publisher,
            Reviews: book.reviews,
            Likes: book.likes
        }));
    };

    const renderBookReviews = (book) => {
        if (!book.reviewList || book.reviewList.length === 0) {
            return <p className="text-muted">No reviews yet</p>;
        }

        return (
            <div className="mt-3">
                <h5>Reviews</h5>
                {book.reviewList.map((review, index) => (
                    <Card key={index} className="mb-2">
                        <Card.Body>
                            <div className="d-flex justify-content-between">
                                <div>
                                    <strong>{review.reviewer}</strong>
                                    <div className="text-warning small">
                                        {'★'.repeat(review.rating)}
                                        {'☆'.repeat(5 - review.rating)}
                                    </div>
                                </div>
                                <small className="text-muted">{review.date}</small>
                            </div>
                            <p className="mt-2 mb-0">{review.comment}</p>
                        </Card.Body>
                    </Card>
                ))}
            </div>
        );
    };

    const renderTableView = () => (
        <div className="table-container">
            <Table striped bordered hover responsive>
                <thead>
                <tr>
                    <th>#</th>
                    <th>ISBN</th>
                    <th>Title</th>
                    <th>Author(s)</th>
                    <th>Publisher</th>
                </tr>
                </thead>
                <tbody>
                {books.map((book) => (
                    <React.Fragment key={book.index}>
                        <tr
                            style={{ cursor: 'pointer' }}
                            onClick={() => setExpandedBook(expandedBook === book ? null : book)}
                            className={expandedBook === book ? "selected-row" : ""}
                        >
                            <td>{book.index}</td>
                            <td>{book.isbn}</td>
                            <td>{book.title}</td>
                            <td>{book.author}</td>
                            <td>{book.publisher}</td>
                        </tr>
                        {expandedBook === book && (
                            <tr>
                                <td colSpan="5" className="p-0">
                                    <Card className="border-0 shadow-sm m-2">
                                        <Card.Body>
                                            <Row>
                                                <Col md={3}>
                                                    <div className="book-cover">
                                                        <img
                                                            src={book.coverUrl}
                                                            alt="Book cover"
                                                            className="img-fluid shadow"
                                                        />
                                                        <div className="book-overlay">
                                                            <h5 className="book-title">{book.title}</h5>
                                                            <p className="book-author">{book.author}</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 text-center">
                                                        <div className="d-flex justify-content-center">
                                                            {getStarRating(book.rating)}
                                                        </div>
                                                        <div className="likes-count mt-2">
                                                            <i className="bi bi-heart-fill text-danger"></i> {book.likes} likes
                                                        </div>
                                                    </div>
                                                </Col>
                                                <Col md={9}>
                                                    <div className="book-details">
                                                        <h3>{book.title}</h3>
                                                        <p className="text-muted">by {book.author}</p>
                                                        <p className="small text-secondary">{book.publisher} • ISBN: {book.isbn}</p>
                                                        <p>{book.description}</p>

                                                        <div className="book-metadata">
                                                            <span className="badge bg-info me-2">Language: {settings.language.toUpperCase()}</span>
                                                            <span className="badge bg-secondary me-2">Pages: {book.pages}</span>
                                                            <span className="badge bg-primary">Published: {book.year}</span>
                                                        </div>
                                                    </div>

                                                    {renderBookReviews(book)}
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>
                                </td>
                            </tr>
                        )}
                    </React.Fragment>
                ))}
                </tbody>
            </Table>
        </div>
    );

    const renderGalleryView = () => (
        <Row className="gallery-view">
            {books.map((book) => (
                <Col key={book.index} xs={12} sm={6} md={4} lg={3} className="mb-4">
                    <Card
                        className={`h-100 book-card ${expandedBook === book ? 'selected-card' : ''}`}
                        onClick={() => setExpandedBook(expandedBook === book ? null : book)}
                    >
                        <div className="book-cover-container">
                            <Card.Img variant="top" src={book.coverUrl} className="book-cover-img" />
                            <div className="book-overlay">
                                <h5 className="book-title">{book.title}</h5>
                                <p className="book-author">{book.author}</p>
                            </div>
                        </div>
                        <Card.Body>
                            <Card.Title>{book.title}</Card.Title>
                            <Card.Subtitle className="mb-2 text-muted">{book.author}</Card.Subtitle>
                            <div className="d-flex justify-content-between align-items-center">
                                {getStarRating(book.rating)}
                                <span className="likes-count">
                  <i className="bi bi-heart-fill text-danger"></i> {book.likes}
                </span>
                            </div>
                        </Card.Body>
                        <Card.Footer className="text-muted small">
                            {book.publisher} • {book.year}
                        </Card.Footer>
                    </Card>
                </Col>
            ))}
        </Row>
    );

    return (
        <Container fluid className="py-4">
            <h2 className="mb-4">Book Browser</h2>

            <Form className="mb-4">
                <Row className="align-items-end">
                    <Col md={3}>
                        <Form.Group className="mb-3">
                            <Form.Label>Language/Region</Form.Label>
                            <ReactSelect
                                options={languages}
                                value={languages.find(lang => lang.value === settings.language)}
                                onChange={(e) => handleSettingChange('language', e.value)}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group className="mb-3">
                            <Form.Label>Seed</Form.Label>
                            <FormControl
                                placeholder="Seed"
                                value={settings.seed}
                                onChange={(e) => handleSettingChange('seed', e.target.value)}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group className="mb-3">
                            <Form.Label>Likes: {settings.likes}</Form.Label>
                            <div className="px-2">
                                <Slider
                                    min={0}
                                    max={10}
                                    step={0.1}
                                    value={settings.likes}
                                    onChange={(val) => handleSettingChange('likes', val)}
                                    railStyle={{ backgroundColor: '#dee2e6', height: 10 }}
                                    trackStyle={{ backgroundColor: '#007bff', height: 10 }}
                                    handleStyle={{
                                        borderColor: '#007bff',
                                        height: 20,
                                        width: 20,
                                        marginTop: -5,
                                        backgroundColor: '#fff',
                                    }}
                                />
                            </div>
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group className="mb-3">
                            <Form.Label>Reviews: {settings.reviews}</Form.Label>
                            <div className="px-2">
                                <Slider
                                    min={0}
                                    max={10}
                                    step={0.1}
                                    value={settings.reviews}
                                    onChange={(val) => handleSettingChange('reviews', val)}
                                    railStyle={{ backgroundColor: '#dee2e6', height: 10 }}
                                    trackStyle={{ backgroundColor: '#007bff', height: 10 }}
                                    handleStyle={{
                                        borderColor: '#007bff',
                                        height: 20,
                                        width: 20,
                                        marginTop: -5,
                                        backgroundColor: '#fff',
                                    }}
                                />
                            </div>
                        </Form.Group>
                    </Col>
                </Row>
            </Form>

            <div className="d-flex justify-content-between mb-3">
                <Nav variant="pills" className="view-toggle">
                    <Nav.Item>
                        <Nav.Link
                            active={viewMode === 'table'}
                            onClick={() => setViewMode('table')}
                        >
                            <i className="bi bi-table me-1"></i> Table View
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link
                            active={viewMode === 'gallery'}
                            onClick={() => setViewMode('gallery')}
                        >
                            <i className="bi bi-grid-3x3-gap me-1"></i> Gallery View
                        </Nav.Link>
                    </Nav.Item>
                </Nav>

                <Button
                    variant="success"
                    onClick={handleExportCSV}
                >
                    <i className="bi bi-file-earmark-excel me-1"></i> Export to CSV
                </Button>

                <CSVLink
                    data={getCSVData()}
                    filename={`books-${settings.language}-${settings.seed}.csv`}
                    className="d-none"
                    ref={csvLinkRef}
                    target="_blank"
                />
            </div>

            <InfiniteScroll
                dataLength={books.length}
                next={() => fetchBooks()}
                hasMore={hasMore}
                loader={<div className="text-center my-3"><div className="spinner-border text-primary" role="status"></div></div>}
                endMessage={<p className="text-center">You've seen all books</p>}
            >
                {viewMode === 'table' ? renderTableView() : renderGalleryView()}
            </InfiniteScroll>
        </Container>
    );
}

export default App;