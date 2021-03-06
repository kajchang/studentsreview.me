import React, { useEffect, useState } from 'react';
import { Button, Chip, Grid, Paper, Typography, ClickAwayListener, Tabs, Tab } from '@material-ui/core';
import { Close } from '@material-ui/icons';
import { useTheme, withStyles } from '@material-ui/styles';
import { Helmet } from 'react-helmet';
import { Query } from 'react-apollo';
import StarRatings from 'react-star-ratings';
import ReviewForm from '../components/ReviewForm';
import DepartmentChip from '../components/DepartmentChip';
import Modal from '../components/Modal';
import SemesterSelect from '../components/SemesterSelect';
import ScheduleTable from '../components/ScheduleTable';
import ReviewDisplay from '../components/ReviewDisplay';

import { isWidthUp } from '@material-ui/core/withWidth';
import { graphql, prefetchPathname } from 'gatsby'
import { navigate } from '@reach/router';
import slugify from 'slugify';
import { FIND_REVIEWS } from '../graphql';
import { formatSemesterRange, getCurrentSemester, getBlocks, removeDupes, sortSemesters, useWidth } from '../utils';
import { trackCustomEvent } from 'gatsby-plugin-google-analytics';

import { LowellHighSchool } from '../schema';
import styles from '../styles/styles';

const HeaderCard = withStyles(styles)(({ classes, rating, semesters, departments, name }) => {
    const [modalExposed, setModalExposed] = useState(false);
    const theme = useTheme();

    return (
        <Paper className={ classes.control }>
            <div style={ { marginBottom: theme.spacing(1) } }>
                <Typography variant='h6' style={ {
                    display: 'inline',
                    marginRight: theme.spacing(2)
                } }>{ name }</Typography>
                <StarRatings
                    rating={ isNaN(rating) ? 0 : rating }
                    starRatedColor='gold'
                    starHoverColor='gold'
                    numberOfStars={ 5 }
                    starDimension={ theme.spacing(5) }
                    starSpacing={ theme.spacing(0.5) }
                />
            </div>
            <Chip label={ formatSemesterRange(semesters) }/>
            {
                departments.map((department, idx) => <DepartmentChip
                    key={ idx }
                    department={ department }
                />)
            }
            <div style={ { marginTop: theme.spacing(1) } }>
                <Button
                    variant='contained'
                    color='primary'
                    disabled={ !semesters.includes(getCurrentSemester()) }
                    onClick={ () => setModalExposed(true) }
                >Write a Review</Button>
                <Modal shown={ modalExposed }>
                    <Grid item xs={ 12 } sm={ 6 }>
                        <ClickAwayListener onClickAway={ () => setModalExposed(false) }>
                            <Paper className={ classes.control }>
                                <Close onClick={ () => setModalExposed(false) } style={ { cursor: 'pointer', float: 'right' } }/>
                                <ReviewForm
                                    teacher={ name }
                                    onClose={ () => setModalExposed(false) }
                                />
                            </Paper>
                        </ClickAwayListener>
                    </Grid>
                </Modal>
            </div>
        </Paper>
    );
});

const Sidebar = withStyles(styles)(({ classes, classes_, semesters, location }) => {
    const initialSemester = location.state && location.state.semester;
    const [semester, setSemester] = useState(semesters.includes(initialSemester) ? initialSemester : semesters[0]);

    const semesterClasses = classes_
        .filter(class_ => class_.semester === semester);

    useEffect(() => {
        const shownClasses = removeDupes(semesterClasses.map(class_ => class_.name));
        for (let class_ of shownClasses) {
            prefetchPathname(`/courses/${ slugify(class_, { lower: true }) }`);
        }
    }, [semesterClasses]);

    return (
        <>
            <SemesterSelect
                semesters={ semesters }
                value={ semester }
                onChange={ semester => {
                    trackCustomEvent({
                        category: 'Semester Select',
                        action: 'Select',
                        label: semester
                    });
                    setSemester(semester);
                } }
            />
            <ScheduleTable
                blocks={ getBlocks().concat(removeDupes(semesterClasses.map(class_ => class_.block).filter(block => block > 8))) }
            >
                { ({ block }) => semesterClasses
                    .filter(class_ => class_.block === block)
                    .map((class_, idx) =>
                        <Chip
                            key={ idx }
                            className={ class_.name.length > 25 ? classes.scalingText : null }
                            label={ `${ class_.name }${ class_.section ? ` (${ class_.section })` : '' }` }
                            onClick={ () => navigate(`/courses/${ slugify(class_.name, { lower: true }) }`, {
                                state: { semester: semester === semesters[0] ? null : semester }
                            }) }
                        />)
                }
            </ScheduleTable>
        </>
    );
});

const TeacherPage = ({ data, pageContext, classes, location }) => {
    const { name } = pageContext;

    const classes_ = data.srapi.findManyClass;
    const semesters = sortSemesters(removeDupes(data.srapi.findManyClass.map(class_ => class_.semester)));
    const departments = data.srapi.findOneTeacher.departments;

    const [rating, setRating] = useState(0);
    const [currentTab, setCurrentTab] = useState(0);

    const width = useWidth();

    return (
        <>
            <Helmet>
                <title>{ name }</title>
                <meta name='description' content={ `See students' reviews of ${ name }, a teacher at Lowell High School.` }/>
                <meta name='keywords' content={ ['Education', 'Lowell High School', 'Teacher', name, ...departments] }/>
                <script type='application/ld+json'>
                    { JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Person',
                        name,
                        jobTitle: 'Teacher',
                        knowsAbout: departments.join(', '),
                        affiliation: LowellHighSchool
                    }) }
                </script>
            </Helmet>
            <div className={ classes.root }>
                <Grid container spacing={ 3 }>
                    <Query
                        query={ FIND_REVIEWS }
                        variables={ { name } }
                        onCompleted={ data => setRating(data.findOneTeacher.rating) }
                        notifyOnNetworkStatusChange={ true }
                    >
                        { ({ data }) => isWidthUp('sm', width) ? <>
                            <Grid item sm={ 5 }>
                                <HeaderCard rating={ rating } semesters={ semesters } departments={ departments } name={ name }/>
                                <Sidebar classes_={ classes_ } semesters={ semesters } location={ location }/>
                            </Grid>
                            <Grid item sm={ 7 }>
                                <ReviewDisplay teacher={ name } reviews={ data.reviewPagination }/>
                            </Grid>
                        </> : <>
                            <Grid item xs={ 12 }>
                                <HeaderCard rating={ rating } semesters={ semesters } departments={ departments } name={ name }/>
                                <Tabs value={ currentTab } onChange={ (_, tab) => setCurrentTab(tab) } style={ { alignItems: 'center' } }>
                                    <Tab label='Reviews'/>
                                    <Tab label='Courses'/>
                                </Tabs>
                            </Grid>
                            <Grid item xs={ 12 }>
                                {
                                    currentTab === 0 ?
                                        <ReviewDisplay teacher={ name } reviews={ data.reviewPagination }/> :
                                        <Sidebar classes_={ classes_ } semesters={ semesters } location={ location }/>
                                }
                            </Grid>
                        </> }
                    </Query>
                </Grid>
            </div>
        </>
    );
};

export default withStyles(styles)(TeacherPage);

export const query = graphql`
    query($name: String!) {
        srapi {
            findOneTeacher(filter: {
                name: $name
            }) {
                rating
                reviewCount
                departments
            }
            findManyClass(filter: {
                teacher: $name
            }) {
                semester
                name
                block
                section
            }
        }
    }
`;
