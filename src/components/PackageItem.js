import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

const PackageItem = ({ packageData, onPress }) => {
  const { title, image, price, description } = packageData;

  const getImage = (path) => {
    switch (path) {
      case '../../assets/pacotes/friends.jpg':
        return require('../../assets/pacotes/friends.jpg');
      case '../../assets/pacotes/rela.jpg':
        return require('../../assets/pacotes/rela.jpg');
      case '../../assets/pacotes/memorias.jpg':
        return require('../../assets/pacotes/memorias.jpg');
      case '../../assets/pacotes/sobrevoce.jpg':
        return require('../../assets/pacotes/sobrevoce.jpg');
      case '../../assets/pacotes/amigos.jpg':
        return require('../../assets/pacotes/amigos.jpg');
      case '../../assets/pacotes/18.jpg':
        return require('../../assets/pacotes/18.jpg');
      case '../../assets/pacotes/ludicas.jpg':
        return require('../../assets/pacotes/ludicas.jpg');
      case '../../assets/pacotes/politicamente.jpg':
        return require('../../assets/pacotes/politicamente.jpg');
      case '../../assets/pacotes/rir.jpg':
        return require('../../assets/pacotes/rir.jpg');
      case '../../assets/pacotes/crush.jpg':
        return require('../../assets/pacotes/crush.jpg');
        case '../../assets/pacotes/familia.jpg':
          return require('../../assets/pacotes/familia.jpg');
      default:
        return require('../../assets/pacotes/rir.jpg'); // Adicione uma imagem padrão caso o caminho não seja encontrado
    }
  };

  const handlePress = () => {
    onPress(packageData);
  };

  // Log para identificar o pacote na tela

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity onPress={handlePress}>
        <View style={styles.imageWrapper}>
          <View style={styles.imageContainer}>
            <Image source={getImage(image)} style={styles.image} />
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.detailsContainer}>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Text style={styles.price}>{price}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
    top: 50
  },
  imageWrapper: {
    borderWidth: 5,
    borderColor: 'white',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    overflow: 'hidden',
  },
  imageContainer: {
    width: 250,
    height: 400,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  title: {
    fontSize: 25,
    color: 'black',
    textAlign: 'center',
    fontFamily: 'Accid',
    backgroundColor: 'white',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    top: 20,
    zIndex: 10
  },
  detailsContainer: {
    top: -0.5,
    padding: 10,
    alignItems: 'center',
    width: 260,
    backgroundColor: 'white',
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5
  },
  description: {
    fontSize: 15,
    color: 'black',
    textAlign: 'center',
    marginBottom: 18,
    fontFamily: 'Quicksand-VariableFont_wght',
    textDecorationLine: 'underline', // Adiciona sublinhado à descrição
  },
  price: {
    width: 70,
    fontSize: 20,
    color: 'yellow',
    textAlign: 'center',
    fontFamily: 'Accid',
    bottom: 16,
    borderRadius: 3,
    backgroundColor: 'black',
  },
});

export default PackageItem;
