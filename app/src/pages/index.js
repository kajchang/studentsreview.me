import React, { useEffect, useRef, useState } from 'react'
import { Button, MenuItem, MenuList, Popper, TextField, Typography, Grid, Paper } from '@material-ui/core';
import { withTheme } from '@material-ui/styles';
import { withApollo } from 'react-apollo';
import { Helmet } from 'react-helmet';
import CountUp from 'react-countup';

import { FIND_REVIEWS } from '../graphql';
import { graphql } from 'gatsby';
import slugify from 'slugify';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import { navigate } from '@reach/router';
import { removeDupes } from '../utils';

const IndexPage = ({ data, theme, client }) => {
    const [value, setValue] = useState('');
    const inputRef = useRef(null);

    const teacherNames = data.srapi.findManyTeacher.map(teacher => teacher.name);
    const courseNames = removeDupes(data.srapi.findManyCourse.map(course => course.name));

    if (teacherNames.indexOf('Undetermined') !== -1) {
        teacherNames.splice(teacherNames.indexOf('Undetermined'), 1);
    }

    const items = teacherNames.concat(courseNames);
    const suggestions = items.filter(item => match(item, value).length > 0).sort((a, b) => match(b, value).length - match(a, value).length).slice(0, 5);

    const keyDownHandler = e => {
        if (e.key === 'Enter') {
            if (teacherNames.includes(value)) {
                navigate(`/teachers/${ slugify(value, { lower: true }) }`);
            } else if (courseNames.includes(value)) {
                navigate(`/courses/${ slugify(value, { lower: true }) }`);
            }
        }
    }

    useEffect(() => {
        window.addEventListener('keydown', keyDownHandler);
        return () => window.removeEventListener('keydown', keyDownHandler);
    });

    useEffect(() => {
        if (teacherNames.includes(value)) {
            client.query({
                query: FIND_REVIEWS,
                variables: {
                    name: value
                }
            });
        }
    }, [value]);

    return (
        <Grid container direction='column' justify='center' alignItems='center' style={ {
            minHeight: '70%',
            textAlign: 'center'
        } }>
            <Helmet>
                <title>Students Review</title>
                <meta name='description' content='Students Review is a education website for students to share and read reviews of courses and teachers at Lowell High School.'/>
                <meta name='keywords' content={ ['Education', 'Lowell High School', 'Review'].join(',') }/>
            </Helmet>
            <Typography variant='h4'>Lowell High School Teacher Reviews</Typography>
            <Typography variant='body1'>
                <CountUp
                    end={ data.srapi.teacherCount }
                    formattingFn={ num => `${ num.toLocaleString() } Teachers, ` }
                />
                <CountUp
                    end={ data.srapi.courseCount }
                    formattingFn={ num => `${ num.toLocaleString() } Courses, ` }
                />
                <CountUp
                    end={ data.srapi.reviewCount }
                    formattingFn={ num => `${ num.toLocaleString() } Reviews` }
                />
            </Typography>
            <TextField
                style={ {
                    marginTop: theme.spacing(10),
                    width: 760,
                    maxWidth: '75vw'
                } }
                inputRef={ inputRef }
                value={ value }
                onChange={ e => setValue(e.target.value) }
                inputProps={ {
                    onKeyDown: e => {
                        if (e.key === 'Enter') {
                            if (teacherNames.includes(value)) {
                                navigate(`/teachers/${ slugify(value, { lower: true }) }`);
                            } else if (courseNames.includes(value)) {
                                navigate(`/courses/${ slugify(value, { lower: true }) }`);
                            } else {
                                setValue(suggestions[0]);
                            }
                            e.stopPropagation();
                        }
                    }
                } }
                placeholder='Search Teachers and Courses...'
            />
            <Popper open={ Boolean(suggestions) && !items.includes(value) } anchorEl={ inputRef.current }>
                <MenuList style={ { padding: 0, width: inputRef.current && inputRef.current.clientWidth } } component={ Paper }>
                    {
                        suggestions.map((suggestion, idx) => <MenuItem
                                key={ idx }
                                onClick={ () => setValue(suggestion) }
                                style={ { cursor: 'pointer' } }
                            >{
                                parse(suggestion, match(suggestion, value)).map((match, idx) => <span key={ idx } style={ {
                                    opacity: match.highlight ? 1 : 0.5,
                                    whiteSpace: 'pre'
                                } }>
                                    { match.text }
                                </span>)
                            }</MenuItem>
                        )
                    }
                </MenuList>
            </Popper>
            <Button onClick={ () => {
                if (teacherNames.includes(value)) {
                    navigate(`/teachers/${ slugify(value, { lower: true }) }`);
                } else if (courseNames.includes(value)) {
                    navigate(`/courses/${ slugify(value, { lower: true }) }`);
                }
            } }>Select</Button>
        </Grid>
    );
}

export const query = graphql`
    query {
        srapi {
            courseCount
            reviewCount
            teacherCount
            findManyCourse {
                name
            }
            findManyTeacher {
                name
            }
        }
    }
`;

export default withTheme(withApollo(IndexPage));
