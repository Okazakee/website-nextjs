import React, { useState, useContext, useEffect } from 'react';
import { MainContext } from '../../components/context/MainContext';
import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';
import { MongoClient } from 'mongodb';

export default function Cms({ avaliablePages, collectionsPagesData }) {
  const { pageStyles, isUserAuth } = useContext(MainContext);
  const [selectedPage, SetSelectedPage] = useState(avaliablePages[0]);
  const [selectedItem, SetSelectedItem] = useState('0');

  const setItems = (direction) => {
    const itemsList = collectionsPagesData[selectedPage];

    direction === 'next'
      ? SetSelectedItem((prevItem) =>
          Math.min(prevItem + 1, itemsList.length - 1)
        )
      : SetSelectedItem((prevItem) => Math.max(prevItem - 1, 0));
  };

  const styles = {
    header: {
      div1: 'mt-20 sm:-mt-10 mb-16 py-5 w-[90vw] max-w-7xl',
      div2: 'mx-5',
      div3: 'flex items-center justify-center border rounded-3xl min-w-[50%] h-12 mb-5',
      h1: 'mx-5 text-2xl',
      div5: 'mt-20 sm:-mt-10 mb-16 py-5 w-[90vw] max-w-7xl',
      label: 'text-[#8c54fb] cursor-text',
    },
    buttons: {
      div1: 'flex',
      div2: 'flex-wrap border basis-1/5 rounded-3xl pt-5 px-5 mx-5 lg:text-lg h-[70vh]',
      div3_4:
        'cursor-pointer border text-center px-2 py-1 mb-5 rounded-3xl hover:bg-[#8c54fb]',
    },
    body: {
      buttons:
        'border text-center px-2 py-1 mb-5 rounded-3xl hover:bg-[#8c54fb] mx-2',
      div1: 'flex-wrap border basis-4/5 rounded-3xl pt-5 px-5 mr-5 max-h-[60vh] md:max-h-[70vh] lg:text-lg',
      div2: 'text-end cursor-pointer',
    },
    imgdiv: 'relative h-[25vh] sm:h-[20vh] max-w-[35%] mx-auto',
  };

  return (
    <div>
      {isUserAuth && (
        <div className={styles.header.div1}>
          <div className={styles.header.div2}>
            <div className={styles.header.div3}>
              <h1 className={styles.header.h1}>
                You are currently editing{' '}
                <label className={styles.header.label}>{selectedPage}</label>{' '}
                page
              </h1>
            </div>
          </div>
          <div className={styles.buttons.div1}>
            <div className={styles.buttons.div2}>
              {avaliablePages.map((page, i) => (
                <div
                  onClick={() => SetSelectedPage(page)}
                  key={i}
                  className={`${styles.buttons.div3_4} ${
                    selectedPage === page && 'bg-[#8c54fb]'
                  }`}
                >
                  <div className="">{page}</div>
                </div>
              ))}
              <div onClick={() => null} className={styles.buttons.div3_4}>
                <div className="">+</div>
              </div>
            </div>
            <div className={styles.body.div1}>
              <div className="flex justify-center pb-2 -mt-2">
                <button
                  className={styles.body.buttons}
                  onClick={() => setItems('prev')}
                >
                  Previous Item
                </button>
                <button
                  className={styles.body.buttons}
                  onClick={() => setItems('next')}
                >
                  Next Item
                </button>
                <button className={styles.body.buttons}>Apply</button>
                <button className={styles.body.buttons}>Reload ↻</button>
              </div>
              <div className="max-h-[55vh] md:max-h-[62vh] overflow-y-auto">
                <div className={styles.imgdiv}>
                  <Image
                    className="rounded-xl"
                    src={collectionsPagesData[selectedPage][selectedItem].img}
                    alt="img"
                    layout="fill"
                    objectFit="cover"
                    objectPosition="50% 25%"
                    priority="true"
                    quality={100}
                  />
                </div>
                {Object.entries(
                  collectionsPagesData[selectedPage][selectedItem]
                ).map(([key, value]) => (
                  <div className="flex mb-2">
                    <h1 className="mr-3">{key}</h1>
                    <p>{value}</p>
                  </div>
                ))}
                {/* <div className="flex mb-2">
                  <h1 className="mr-3">
                    title: {collectionsPagesData[selectedPage][0].title}
                  </h1>
                </div>
                <div className="flex mb-2">
                  <h1 className="mr-3">
                    bio: {collectionsPagesData[selectedPage][0].bio}
                  </h1>
                </div>
                <div className="flex mb-2">
                  <h1 className="mr-3">
                    Img Link: {collectionsPagesData[selectedPage][0].img}
                  </h1>
                </div>
                <div className="flex mb-2">
                  <h1 className="mr-3">
                    Markdown: {collectionsPagesData[selectedPage][0].markdown}
                  </h1>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps(context) {
  // Detect what type of page it is and serve a different response, like pageType=[1/2/3] 1= bio 2= article etc.
  // if articles, show a grid of articles titles, each one can be clicked to open and edit its values
  // if not, show directly editable data when clicking on left button

  let client;
  let db;
  let collectionsData;
  let collectionsPagesData;
  let avaliablePages;

  // Connect to mongoDB and collection
  try {
    client = await MongoClient.connect(process.env.MONGODB_URI);
    console.log('Connected to mongoDB');

    db = client.db(process.env.COLLECTION_ENV);
    console.log(`Connected to ${process.env.COLLECTION_ENV}.`);
  } catch (e) {
    console.error('Error occured while connecting to MongoDB,', e);
  }

  // Gather collections data
  try {
    collectionsData = await db.listCollections().toArray();
    console.log('Correctly gathered collections data');
  } catch (e) {
    console.error('Error occured while fetching collections names,', e);
  }

  // Gather avaliable pages
  try {
    avaliablePages = collectionsData
      .map((collection) => collection.name)
      .sort();

    console.log(`Avaliable pages: ${avaliablePages}`);
  } catch (e) {
    console.error('Error occured while getting avaliable pages,', e);
  }

  // Gather pages data
  try {
    collectionsPagesData = {};

    for (const collectionName of avaliablePages) {
      const data = await db.collection(collectionName).find({}).toArray();
      // Convert each ObjectId to string
      collectionsPagesData[collectionName] = data.map((d) => {
        if (d._id) {
          d._id = d._id.toString();
        }
        return d;
      });
    }

    console.log('Correctly gathered pages data');
  } catch (e) {
    console.error('Error occured while fetching collections names,', e);
  }

  // Send all props to frontend
  try {
    console.log('Sending props to frontend...');

    return {
      props: {
        avaliablePages,
        collectionsPagesData,
      },
    };
  } catch (e) {
    console.error('Error occured while sending props to frontend', e);
  }

  // Make serialized response to be served as prop
  /* const collectionsData = {};
    for (const collectionName of avaliablePages) {
      const data = await db.collection(collectionName).find({}).toArray();
      // Convert each ObjectId to string
      collectionsData[collectionName] = data.map((d) => {
        if (d._id) {
          d._id = d._id.toString();
        }
        return d;
      });
    } */
}
